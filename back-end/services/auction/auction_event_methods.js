const stop_auction_types = {
  //diffrent auctions may need different ways to stop
  forward_auction: stop_forward_auction,
  dutch_auction: stop_dutch_auction,
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

async function stop_auction(auction, pool_connection, redis_client, producer) {
  if (stop_auction_types[auction.auction_type] != null) {
    await stop_auction_types[auction.auction_type](auction, pool_connection, redis_client, producer);
  }
}

async function stop_forward_auction(auction, pool_connection, redis_client, producer) {
  //sets is_active in postgres to false, removes auction from redis, and creates a order async, the winner is the last bid if any
  const client = await pool_connection.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE auctions SET is_active = false WHERE auction_id = $1", [auction.auction_id]);
    const last_bid = await redis_client.zRangeWithScores(`bids:${auction.auction_id}`, -1, -1);
    console.log(last_bid);
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
  } finally {
    client.release();
  }
}

async function stop_dutch_auction(auction, pool_connection, redis_client, producer) {
  //auction field must contain the winner since once someone buys then the auction will end immediate
  console.log(`${JSON.stringify(auction)} stop`);
}

async function notify_order_create() {}
module.exports = { start_auction, stop_auction };
