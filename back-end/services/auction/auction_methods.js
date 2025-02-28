require("dotenv").config(); //environment variables

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
    const auction_query = "INSERT INTO auctions (item_name, item_description, auction_owner, start_time) VALUES($1, $2, $3, $4) RETURNING *";
    const auction_query_values = [item_name, item_description, user.user_id, unix_to_iso];
    const auction_query_result = await client.query(auction_query, auction_query_values);

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
    const auction_query = "INSERT INTO auctions (item_name, item_description, auction_owner, start_time) VALUES($1, $2, $3, $4) RETURNING *";
    const auction_query_values = [item_name, item_description, user.user_id, unix_to_iso];
    const auction_query_result = await client.query(auction_query, auction_query_values);

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

module.exports = { create_dutch_auction, create_forward_auction, verify_token };
