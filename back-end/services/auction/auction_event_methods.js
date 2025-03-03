const stop_auction_types = {
  //diffrent auctions may need different ways to stop
  forward_auction: stop_forward_auction,
};
async function start_auction(auction, pool_connection, redis_client) {
  const client = await pool_connection.connect();
  try {
    await client.query("BEGIN");
    const update_active_query = "UPDATE auctions SET is_active = true WHERE auction_id = $1";
    await client.query(update_active_query, [auction.auction_id]);

    await redis_auction_function.set_is_active(auction.auction_id, redis_client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
  } finally {
    client.release();
  }
}

async function stop_auction(auction, pool_connection, redis_client) {
  if (stop_auction_types[auction.auction_type] != null) {
    stop_auction_types[auction.auction_type](auction, pool_connection, redis_client);
  }
}

async function stop_forward_auction(auction, pool_connection, redis_client) {
  console.log(`${auction} stop`);
}

module.exports = { start_auction, stop_auction };
