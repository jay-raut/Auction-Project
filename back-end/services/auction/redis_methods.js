require("dotenv").config(); //environment variables
const bid_functions = {
  dutch_auction: bid_dutch,
  forward_auction: bid_forward,
};
async function create_dutch_auction_redis(redis_client, auction_details, start_time) {
  if (!redis_client) {
    return { status: 400, message: "redis_client not initalized" };
  }
  if (!auction_details) {
    return { status: 400, message: "missing auction details" };
  }
  console.log(auction_details);
  await redis_client.hSet(`auction:${auction_details.auction_id}`, {
    auction_id: auction_details.auction_id,
    start_time: start_time,
    is_active: 0,
    auction_owner: auction_details.auction_owner,
    auction_type: "dutch_auction",
    starting_amount: auction_details.starting_amount,
    has_ended: 0,
  });
  return { status: 200, message: "created auction in redis" };
}

async function create_forward_auction_redis(redis_client, auction_details, start_time, end_time) {
  if (!redis_client) {
    return { status: 400, message: "redis_client not initalized" };
  }
  if (!auction_details) {
    return { status: 400, message: "missing auction details" };
  }

  await redis_client.hSet(`auction:${auction_details.auction_id}`, {
    auction_id: auction_details.auction_id,
    start_time: start_time,
    end_time: end_time,
    is_active: 0,
    auction_owner: auction_details.auction_owner,
    auction_type: "forward_auction",
    starting_amount: auction_details.starting_amount,
    has_ended: 0,
  });
  return { status: 200, message: "created auction in redis" };
}

async function handle_bid(redis_client, auction_id, bid_amount, user) {
  if (!redis_client) {
    return { status: 400, message: "redis_client not initalized" };
  }
  const auction_key = `auction:${auction_id}`;
  const auction = await redis_client.hGetAll(auction_key);
  if (Object.keys(auction).length == 0) {
    return { status: 404, message: "Auction not found in redis" };
  }
  if (auction.is_active != true) {
    return { status: 400, message: "This auction is not active" };
  }
  const bid_result = await bid_functions[auction.auction_type](redis_client, auction_id, bid_amount, user);

  return { status: bid_result.status, message: bid_result.message };
}
async function bid_dutch(redis_client, auction_id, bid_amount, user) {
  const auction_key = `auction:${auction_id}`;
  const auction = await redis_client.hGetAll(auction_key);
  if (auction.auction_owner !== user.user_id) {
    return { status: 403, message: "Only the auction owner can reduce the price" };
  }
  if (bid_amount > auction.starting_amount) {
    return { status: 400, message: `Bid amount must be less ${auction.starting_amount}` };
  }

  const bids_key = `bids:${auction_id}`;
  const lowest_bid = await redis_client.zRangeWithScores(bids_key, 0, 0);

  if (lowest_bid.length > 0 && bid_amount >= lowest_bid[0].score) {
    return { status: 400, message: `Your bid must be lower than the current lowest bid of ${lowest_bid[0].score}` };
  }

  const bid_data = JSON.stringify({ user: user.user_id, timestamp: Date.now() });
  console.log(bid_data);
  await redis_client.zAdd(bids_key, [{ score: bid_amount, value: bid_data }]);

  return { status: 200, message: `Bid placed: ${bid_amount}` };
}

async function bid_forward(redis_client, auction_id, bid_amount, user) {
  const auction_key = `auction:${auction_id}`;
  const auction = await redis_client.hGetAll(auction_key);

  if (bid_amount <= auction.starting_amount) {
    return { status: 400, message: `Bid amount must be greater than ${auction.starting_amount}` };
  }

  const now = Date.now();
  if (new Date(auction.end_time).getTime() < now) {
    return { status: 400, message: `Bidding is finished on this auction` };
  }

  const bids_key = `bids:${auction_id}`;

  const highest_bid = await redis_client.zRangeWithScores(bids_key, -1, -1);

  if (highest_bid.length > 0 && bid_amount <= highest_bid[0].score) {
    return { status: 400, message: `Your bid must be higher than the current highest bid of ${highest_bid[0].score}` };
  }
  const bid_data = JSON.stringify({ user: user.user_id, timestamp: Date.now() });
  console.log(bid_data);
  await redis_client.zAdd(bids_key, [{ score: bid_amount, value: bid_data }]);

  return { status: 200, message: `Bid placed: ${bid_amount}` };
}

async function get_current_bid(auction_id, redis_client) {
  if (!redis_client) {
    return { status: 400, message: "redis_client not initalized" };
  }
  const auction_key = `auction:${auction_id}`;
  const auction = await redis_client.hGetAll(auction_key);
  if (Object.keys(auction).length == 0) {
    return { status: 404, message: "Auction not found in redis" };
  }
  if (auction.is_active != true) {
    return { status: 400, message: "This auction is not active" };
  }
  const bids_key = `bids:${auction_id}`;
  let current_bid;
  if (auction.auction_type == "forward_auction") {
    current_bid = await redis_client.zRangeWithScores(bids_key, -1, -1);
  } else {
    current_bid = await redis_client.zRangeWithScores(bids_key, 0, 0);
  }

  if (!current_bid.length) {
    return { status: 200, current_bid: Number(auction.starting_amount) };
  }

  return { status: 200, current_bid: Number(current_bid[0].score) };
}

async function set_is_active(auction_id, redis_client) {
  const auction_key = `auction:${auction_id}`;

  const exists = await redis_client.exists(auction_key);
  if (!exists) {
    console.error(`Auction ${auction_id} does not exist.`);
    return;
  }

  await redis_client.hSet(auction_key, "is_active", "1");
  console.log(`Auction ${auction_id} is now active.`);
}

module.exports = { create_dutch_auction_redis, create_forward_auction_redis, handle_bid, set_is_active, get_current_bid };
