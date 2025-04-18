require("dotenv").config(); //environment variables
const redis_auction_function = require("./redis_methods");
const auction_event_functions = require("./auction_event_methods");

const create_auction_redis = {
  dutch_auction: redis_auction_function.create_dutch_auction_redis,
  forward_auction: redis_auction_function.create_forward_auction_redis,
};

const auction_buy_now = {
  dutch_auction: buy_now_dutch_auction,
};

async function create_base_auction(client, item_name, item_description, user, start_time, auction_type, starting_amount, shipping_cost, expedited_shipping_cost) {
  //use only within a transaction

  const auction_query =
    "INSERT INTO auctions (item_name, item_description, auction_owner, start_time, auction_type, starting_amount, shipping_cost, expedited_shipping_cost) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
  const auction_query_values = [item_name, item_description, user.user_id, start_time, auction_type, starting_amount, shipping_cost, expedited_shipping_cost];
  return await client.query(auction_query, auction_query_values);
}

async function create_dutch_auction(redis_client, pool_connection, auction_info, user) {
  const { item_name, item_description, auction_type, start_time, starting_amount, shipping_cost, expedited_shipping_cost } = auction_info;
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
    const auction_query_result = await create_base_auction(client, item_name, item_description, user, unix_to_iso, auction_type, starting_amount, shipping_cost, expedited_shipping_cost);
    const dutch_auction_query = "INSERT INTO dutch_auction (auction_id) VALUES($1)";
    const dutch_auction_query_values = [auction_query_result.rows[0].auction_id];
    await client.query(dutch_auction_query, dutch_auction_query_values);

    //try to create auction in redis before commit

    const create_auction_redis_result = await redis_auction_function.create_dutch_auction_redis(redis_client, auction_query_result.rows[0], unix_to_iso);
    if (create_auction_redis_result.status != 200) {
      return { status: create_auction_redis_result.status, message: create_auction_redis_result.message };
    }
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
  const { item_name, item_description, auction_type, start_time, end_time, starting_amount, shipping_cost, expedited_shipping_cost } = auction_info;
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
    const auction_query_result = await create_base_auction(client, item_name, item_description, user, unix_to_iso, auction_type, starting_amount, shipping_cost, expedited_shipping_cost);
    const forward_auction_query = "INSERT INTO forward_auction (auction_id, end_time) VALUES($1, $2) RETURNING *";
    const forward_auction_query_values = [auction_query_result.rows[0].auction_id, end_unix_to_iso];
    const forward_auction_query_result = await client.query(forward_auction_query, forward_auction_query_values);

    //try to create auction in redis before commit
    const create_auction_redis_result = await redis_auction_function.create_forward_auction_redis(redis_client, auction_query_result.rows[0], unix_to_iso, end_unix_to_iso);
    if (create_auction_redis_result.status != 200) {
      return { status: create_auction_redis_result.status, message: create_auction_redis_result.message };
    }

    await client.query("COMMIT");

    return { status: 200, message: "Auction created", auction: auction_query_result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function get_auction_by_id(id, pool_connection, redis_client) {
  const client = await pool_connection.connect();
  try {
    const auction_result = await client.query("SELECT * FROM auctions WHERE auction_id = $1", [id]);

    if (auction_result.rows.length === 0) {
      //check auction table
      return { status: 404, message: "Auction not found" };
    }
    let auction_data = auction_result.rows[0];
    let query_result;
    if (auction_data.auction_type) {
      //hard coded
      query_result = await client.query(`SELECT * FROM ${auction_data.auction_type} WHERE auction_id = $1`, [id]);
    } else {
      //should never happen since auction_type is enforced as non-null in db
      return { status: 400, message: "Missing auction type" };
    }
    //one to one relationship between 'auctions' table and dutch/forward auction
    const get_current_bid = await redis_auction_function.get_current_bid(id, redis_client);
    if (get_current_bid.status == 200) {
      auction_data.current_bid = get_current_bid.current_bid;
    }
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

async function get_all_auctions(pool_connection, redis_client) {
  const client = await pool_connection.connect();
  try {
    const get_all = await client.query("SELECT * FROM auctions");
    const join_types = await Promise.all(
      get_all.rows.map(async (auction) => {
        let query = await client.query(`SELECT * FROM ${auction.auction_type} WHERE auction_id = $1`, [auction.auction_id]);
        if (auction.is_active) {
          const get_current_bid = await redis_auction_function.get_current_bid(auction.auction_id, redis_client);
          if (get_current_bid.status == 200) {
            auction.current_bid = get_current_bid.current_bid;
          }
        }
        return Object.assign({}, auction, query.rows[0]);
      })
    );
    return { status: 200, auctions: join_types };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function get_auction_by_name(item_name, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const auction_result = await client.query("SELECT * FROM auctions WHERE item_name LIKE $1", [`%${item_name}%`]);
    let auction_result_rows = auction_result.rows;
    let auctions_with_details = [];

    for (const auction of auction_result_rows) {
      let auction_data = auction;
      let query_result;

      if (auction_data.auction_type === "dutch_auction") {
        query_result = await client.query(`SELECT * FROM dutch_auction WHERE auction_id = $1`, [auction_data.auction_id]);
      } else if (auction_data.auction_type === "forward_auction") {
        query_result = await client.query(`SELECT * FROM forward_auction WHERE auction_id = $1`, [auction_data.auction_id]);
      } else {
        //should never happen since auction_type is enforced as non-null in db
        return { status: 400, message: "Missing auction type" };
      }

      auctions_with_details.push({ ...auction_data, ...query_result.rows[0] });
    }

    if (auctions_with_details.length > 0) {
      return { status: 200, message: "auctions found", auctions: auctions_with_details };
    }
    return { status: 404, message: "no auctions found" };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function buy_now(auction_id, user, pool_connection, redis_client, producer) {
  const client = await pool_connection.connect();
  try {
    const auction_result = await client.query("SELECT * FROM auctions WHERE auction_id = $1", [auction_id]);
    if (auction_result.rows.length === 0) {
      //check auction table
      return { status: 404, message: "Auction not found" };
    }
    if (auction_result.rows[0].is_active == false) {
      return { status: 400, message: "This auction is not active" };
    }
    const auction = auction_result.rows[0];
    if (auction_buy_now[auction.auction_type] != null) {
      const buy_now_response = await auction_buy_now[auction.auction_type](auction, user, pool_connection, redis_client, producer);
      return buy_now_response;
    }
    return { status: 400, message: "This auction does not support buy now" };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function buy_now_dutch_auction(auction, winning_user, pool_connection, redis_client, producer) {
  const stop_auction_details = { ...auction, winning_user: winning_user };
  const stop_auction_status = await auction_event_functions.stop_auction(stop_auction_details, pool_connection, redis_client, producer);
  return { status: stop_auction_status.status, message: stop_auction_status.message };
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

module.exports = { create_dutch_auction, create_forward_auction, verify_token, get_auction_by_id, get_auction_by_name, buy_now, get_all_auctions };
