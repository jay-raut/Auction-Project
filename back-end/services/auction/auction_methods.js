require("dotenv").config(); //environment variables

async function create_base_auction(client, item_name, item_description, user, start_time, auction_type) {
  //use only within a transaction

  const auction_query = "INSERT INTO auctions (item_name, item_description, auction_owner, start_time, auction_type) VALUES($1, $2, $3, $4, $5) RETURNING *";
  const auction_query_values = [item_name, item_description, user.user_id, start_time, auction_type];
  return await client.query(auction_query, auction_query_values);
}

async function create_dutch_auction(redis_client, pool_connection, auction_info, user) {
  const { item_name, item_description, auction_type, start_time } = auction_info;
  if (!user) {
    throw new Error("user is undefined");
  }

  let unix_to_iso; //convert from unix to iso
  if (start_time === "now") {
    unix_to_iso = new Date();
  } else if (typeof start_time === "number" && start_time > 0) {
    unix_to_iso = new Date(start_time * 1000);
    if (new Date() > unix_to_iso) {
      return { status: 400, message: "start time must be in the future" };
    }
  } else {
    return { status: 400, message: "Invalid start time" };
  }
  unix_to_iso = unix_to_iso.toISOString();
  const client = await pool_connection.connect();
  try {
    await client.query("BEGIN");

    const auction_query_result = await create_base_auction(client, item_name, item_description, user, unix_to_iso, auction_type);

    const dutch_auction_query = "INSERT INTO dutch_auction (auction_id) VALUES($1)";
    const dutch_auction_query_values = [auction_query_result.rows[0].auction_id];
    await client.query(dutch_auction_query, dutch_auction_query_values);
    await client.query("COMMIT");
    return { status: 200, message: "Auction created", auction: auction_query_result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function create_forward_auction(redis_client, pool_connection, auction_info, user) {
  const { item_name, item_description, auction_type, start_time, end_time } = auction_info;
  if (!user) {
    throw new Error("user is undefined");
  }
  if (!end_time) {
    throw new Error("end time is undefined");
  }

  let unix_to_iso; //convert from unix to iso
  if (start_time === "now") {
    unix_to_iso = new Date();
  } else if (typeof start_time === "number" && start_time > 0) {
    unix_to_iso = new Date(start_time * 1000);
    if (new Date() > unix_to_iso) {
      return { status: 400, message: "start time must be in the future" };
    }
  } else {
    return { status: 400, message: "Invalid start time" };
  }

  let end_unix_to_iso;
  if (typeof end_time === "number" && end_time > 0) {
    end_unix_to_iso = new Date(end_time * 1000);
    if (unix_to_iso > end_unix_to_iso) {
      return { status: 400, message: "end time must be greater than start time" };
    }
  } else {
    return { status: 400, message: "Invalid end time" };
  }

  unix_to_iso = unix_to_iso.toISOString();
  end_unix_to_iso = end_unix_to_iso.toISOString();
  const client = await pool_connection.connect();
  try {
    await client.query("BEGIN");
    const auction_query_result = await create_base_auction(client, item_name, item_description, user, unix_to_iso, auction_type);

    const forward_auction_query = "INSERT INTO forward_auction (auction_id, end_time) VALUES($1, $2)";
    const forward_auction_query_values = [auction_query_result.rows[0].auction_id, end_unix_to_iso];
    await client.query(forward_auction_query, forward_auction_query_values);
    await client.query("COMMIT");
    return { status: 200, message: "Auction created", auction: auction_query_result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function get_auction_by_id(id, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const auction_result = await client.query("SELECT * FROM auctions WHERE auction_id = $1", [id]);

    if (auction_result.rows.length === 0) {
      //check auction table
      return { status: 404, message: "Auction not found" };
    }
    let auction_data = auction_result.rows[0];
    let query_result;
    if (auction_data.auction_type == "dutch_auction") { //hard coded 
      query_result = await client.query(`SELECT * FROM dutch_auction WHERE auction_id = $1`, [id]);
    } else if (auction_data.auction_type == "forward_auction") {
      query_result = await client.query(`SELECT * FROM forward_auction WHERE auction_id = $1`, [id]);
    } else {//should never happen since auction_type is enforced as non-null in db
      return { status: 400, message: "Missing auction type" };
    }
    //one to one relationship between 'auctions' table and dutch/forward auction
    auction_data = { ...auction_data, ...query_result.rows[0] };

    return {
      status: 200,
      auction: auction_data,
      message: "Auction found",
    };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function verify_token(token) {
  //sends a request to auth_service
  try {
    const verify = await fetch(`http://${process.env.auth_service_address}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
      }),
    });
    if (verify.status == 200) {
      const get_body = await verify.json();
      return { status: verify.status, user: get_body.user };
    }
    return { status: verify.status };
  } catch (error) {
    console.log(error);
    return { status: 500, message: error };
  }
}

module.exports = { create_dutch_auction, create_forward_auction, verify_token, get_auction_by_id };
