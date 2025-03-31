const redis_methods = require("./redis_methods");
const stop_auction_types = {
  //diffrent auctions may need different ways to stop
  forward_auction: stop_forward_auction,
  dutch_auction: stop_dutch_auction,
};
async function start_auction(auction, pool_connection, redis_client, producer) {
  const client = await pool_connection.connect();
  try {
    await client.query("BEGIN");
    const update_active_query = "UPDATE auctions SET is_active = true WHERE auction_id = $1";
    await client.query(update_active_query, [auction.auction_id]);
    await redis_methods.set_is_active(auction.auction_id, redis_client);
    await producer.send({
      topic: "notification.auction.event",
      messages: [{ value: JSON.stringify({ event_type: "auction.start", auction: auction }) }],
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
  } finally {
    client.release();
  }
}

async function stop_auction(auction, pool_connection, redis_client, producer) {
  //some auctions can be stopped syncronously or async aka some may return a object some may not
  if (stop_auction_types[auction.auction_type] != null) {
    return await stop_auction_types[auction.auction_type](auction, pool_connection, redis_client, producer);
  }
}

async function stop_forward_auction(auction, pool_connection, redis_client, producer) {
  //sets is_active in postgres to false, marks has_ended on redis, and creates a order async, the winner is the last bid if any
  const client = await pool_connection.connect();
  auction.winner = null;
  console.log(auction);
  try {
    const highestBid = await redis_client.zRangeWithScores(`bids:${auction.auction_id}`, -1, -1);
    await client.query("BEGIN");
    if (highestBid.length != 0) {
      //there is a winner
      user = JSON.parse(highestBid[0].value).user;
      auction.winner = user;
      const bid_amount = highestBid[0].score;
      const get_auction = await client.query("UPDATE auctions SET auction_winner = $1 WHERE auction_id = $2 RETURNING *", [user, auction.auction_id]);
      console.log(get_auction);
      await producer.send({
        topic: "order.create",
        messages: [{ value: JSON.stringify({ event_type: "order.create", user: user, winning_amount: bid_amount, auction: get_auction.rows[0] }) }],
      });
    }
    await producer.send({
      topic: "notification.auction.event",
      messages: [{ value: JSON.stringify({ event_type: "auction.ended", auction: auction }) }],
    });
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
  const client = await pool_connection.connect();
  try {
    const current_bid = await redis_client.zRangeWithScores(`bids:${auction.auction_id}`, 0, 0);
    let final_price;
    if (current_bid.length == 0) {
      //the winning bid is the starting price
      final_price = auction.starting_amount;
    } else {
      //otherwise the winning bid is the current smallest bid
      final_price = current_bid[0].score;
    }

    await client.query("BEGIN");
    await client.query("UPDATE auctions SET is_active = false WHERE auction_id = $1", [auction.auction_id]);
    await client.query("UPDATE auctions SET auction_winner = $1 WHERE auction_id = $2", [auction.winning_user.user_id, auction.auction_id]);
    await redis_client.hSet(`auction:${auction.auction_id}`, "is_active", "0");
    await redis_client.hSet(`auction:${auction.auction_id}`, "has_ended", "1");
    await client.query("COMMIT");

    await producer.send({
      topic: "order.create",
      messages: [{ value: JSON.stringify({ event_type: "order.create", user: auction.winning_user.user_id, winning_amount: final_price, auction: auction }) }],
    });
    await producer.send({
      topic: "notification.auction.event",
      messages: [{ value: JSON.stringify({ event_type: "auction.ended", auction: auction }) }],
    });
    return { status: 200, message: "dutch auction stopped" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { start_auction, stop_auction };
