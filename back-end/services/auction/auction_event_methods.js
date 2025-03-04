const redis_methods = require("./redis_methods");
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

    await redis_methods.set_is_active(auction.auction_id, redis_client);
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
  //sets is_active in postgres to false, marks has_ended on redis, and creates a order async, the winner is the last bid if any
  const client = await pool_connection.connect();
  try {
    const highestBid = await redis_client.zRangeWithScores(`bids:${auction.auction_id}`, -1, -1);
    await client.query("BEGIN");
    if (highestBid.length != 0) {
      //there is a winner
      const user = JSON.parse(highestBid[0].value).user;
      const bid_amount = highestBid[0].score;
      await client.query("UPDATE auctions SET auction_winner = $1 WHERE auction_id = $2", [user, auction.auction_id]);
      await producer.send({
        topic: "order.create",
        messages: [{ value: JSON.stringify({ event_type: "order.create", user: user, winning_amount: bid_amount, auction: auction }) }],
      });
    }
    await client.query("UPDATE auctions SET is_active = false WHERE auction_id = $1", [auction.auction_id]);
    await redis_client.hSet(`auction:${auction.auction_id}`, "is_active", "0");
    await redis_client.hSet(`auction:${auction.auction_id}`, "has_ended", "1");
    await client.query("COMMIT");
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
