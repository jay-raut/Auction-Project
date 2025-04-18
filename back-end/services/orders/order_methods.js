require("dotenv").config(); //environment variables
const max_order_retries = Number(process.env.max_order_retries) || 3;
if (!max_order_retries) {
  throw new Error("Cannot get max retries env variable");
}
async function create_order(auction_details, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const check_existing_order = await client.query("SELECT * from orders WHERE auction_id = $1", [auction_details.auction.auction_id]);
    if (check_existing_order.rows.length > 0) {
      console.log(`order already exists for ${auction_details.auction.auction_id}`);
      return;
    }
    await client.query("BEGIN");
    const create_order_query = "INSERT INTO orders (auction_id, user_winner_id, user_seller_id,final_price, shipping_price, expedited_shipping_cost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *";
    const query_result = await client.query(create_order_query, [
      auction_details.auction.auction_id,
      auction_details.user,
      auction_details.auction.auction_owner,
      Number(auction_details.winning_amount),
      auction_details.auction.shipping_cost,
      auction_details.auction.expedited_shipping_cost,
    ]);
    await client.query("COMMIT");
    return { order: query_result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function process_order(auction_details, pool_connection) {
  //processes an order and can retry if order creation fails
  let retries = max_order_retries;
  while (retries > 0) {
    try {
      //try to make the order
      const order = await create_order(auction_details, pool_connection);
      return { status: 200, order: order }; //on success return
    } catch (error) {
      //retry if failed
      console.log(error);
      retries--;
    }
  }
  return { status: 400 };
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

    let get_order = query_result.rows[0];
    if (get_order.user_winner_id != user_id) {
      //check if the user is allowed to see this order
      return { status: 401, message: "This order does not belong to you" };
    }
    const query_order_transactions = await client.query("SELECT * from transactions WHERE order_id = $1", [order_id]);
    get_order = { transactions: query_order_transactions.rows, ...get_order };
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
    const populate_transactions = await Promise.all(
      query_result.rows.map(async (order) => {
        const transactions = await client.query("SELECT * from transactions WHERE order_id = $1", [order.order_id]);
        order.transactions = transactions.rows;
        return order;
      })
    );
    return { status: 200, message: "Order found", orders: populate_transactions };
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

    if (get_order.status != "pending") {
      return { status: 400, message: `This order is already ${get_order.status}` };
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
    const { choosen_expedited_shipping, payment_details, shipping_address, billing_address } = transaction_info;

    console.log("choosen expediated shipping " + choosen_expedited_shipping);
    const final_price = Number(get_order.final_price) + Number(get_order.shipping_price) + Number(choosen_expedited_shipping ? get_order.expedited_shipping_cost : 0);
    console.log(final_price);
    const cost_breakdown = {
      final_price: Number(get_order.final_price),
      shipping_cost: Number(get_order.shipping_price),
      expedited_shipping_cost: choosen_expedited_shipping ? Number(get_order.expedited_shipping_cost) : 0,
      total_amount: final_price,
    };

    await client.query("BEGIN");
    const insert_transaction =
      "INSERT INTO transactions (order_id, amount, transaction_type, payment_method, shipping_address, billing_address, cost_breakdown) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    await client.query(insert_transaction, [order_id, final_price, "payment", payment_details, shipping_address, billing_address, cost_breakdown]);

    const mark_order_complete = "UPDATE orders SET status = 'completed' WHERE order_id = $1"; //maunually marking the order as complete for demo purposes however, a transaction request should be handled as a async job
    await client.query(mark_order_complete, [order_id]);
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

module.exports = { get_order_by_id, process_order, verify_token, get_all_orders, pay_order };
