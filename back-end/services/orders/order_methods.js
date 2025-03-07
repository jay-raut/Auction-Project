require("dotenv").config(); //environment variables

async function create_order(auction_details, pool_connection) {
  const client = await pool_connection.connect();
  console.log(auction_details);
  try {
    const check_existing_order = await client.query("SELECT * from orders WHERE auction_id = $1", [auction_details.auction.auction_id]);
    if (check_existing_order.rows.length > 0) {
      console.log(`order already exists for ${auction_details.auction.auction_id}`);
      return;
    }
    await client.query("BEGIN");
    const create_order_query = "INSERT INTO orders (auction_id, user_winner_id, user_seller_id,final_price) VALUES ($1, $2, $3, $4) RETURNING *";
    const query_result = await client.query(create_order_query, [auction_details.auction.auction_id, auction_details.user, auction_details.auction.auction_owner, auction_details.winning_amount]);
    await client.query("COMMIT");
  } catch (error) {
    console.log(error);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
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

async function pay_order(order_id, user_id, transaction_info, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const query_result = await client.query("SELECT * from orders WHERE order_id = $1", [order_id]);
    if (query_result.rows.length === 0) {
      //check auction table
      return { status: 404, message: "Order not found" };
    }

    const get_order = query_result.rows[0];
    if (get_order.user_winner_id != user_id) {
      //check if the user is allowed to see this order
      return { status: 401, message: "This order does not belong to you" };
    }
    const check_existing_transaction = await client.query("SELECT * from transactions WHERE order_id = $1", [order_id]);
    if (check_existing_transaction.rows.length != 0) {
      //if a transaction exists check it
      const check_completed = check_existing_transaction.rows.find((transaction) => {
        if (transaction.transaction_status == "completed" || transaction.transaction_status == "refunded" || transaction.transaction_status == "pending") {
          return true;
        }
        return false;
      });

      if (check_completed) {
        return { status: 400, message: "This order has already been completed or is pending" };
      }
    }
    const { payment_details, shipping_address, billing_address } = transaction_info;

    await client.query("BEGIN");
    const insert_transaction = "INSERT INTO transactions (order_id, amount, transaction_type, payment_method, shipping_address, billing_address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
    await client.query(insert_transaction, [order_id, get_order.final_price, "payment", payment_details, shipping_address, billing_address]);
    await client.query("COMMIT");
    return { status: 200, message: "Payment completed" };
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

module.exports = { get_order_by_id, create_order, verify_token, get_all_orders, pay_order };
