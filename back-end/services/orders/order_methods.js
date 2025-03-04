require("dotenv").config(); //environment variables

async function create_order(auction, user_id, pool_connection) {
  console.log(auction);
  console.log(user_id);
}

async function get_order_by_id(order_id, user_id, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const query_result = await client.query("SELECT * from orders WHERE order_id = $1", [order_id]);
    console.log(query_result);
    if (query_result.rows.length === 0) {
      //check auction table
      return { status: 404, message: "Order not found" };
    }

    const get_order = query_result.rows[0];
    if (get_order.user_winner_id != user_id) {
      //check if the user is allowed to see this order
      return { status: 401, message: "This order does not belong to you" };
    }

    return { status: 200, message: "Order found", order: get_order };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function get_all_orders(user_id, pool_connection) {

  const client = await pool_connection.connect();
  try {
    const query_result = await client.query("SELECT * from orders WHERE user_winner_id = $1", [user_id]);
    return { status: 200, message: "Order found", orders: query_result.rows };
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

module.exports = { get_order_by_id, create_order, verify_token, get_all_orders };
