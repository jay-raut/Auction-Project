require("dotenv").config(); //environment variables
const redis = require("redis");

const redis_client = redis.createClient({
  url: `redis://${process.env.REDIS_ADDRESS}:${[process.env.REDIS_PORT]}`,
});
redis_client.connect();
redis_client.on("connect", () => console.log("Redis connected"));
redis_client.on("error", (err) => console.error("Redis connection error:", err));

const check_ending = {
  forward_auction: check_forward_ending,
};


var now;
async function check_auctions() {
  now = Date.now();
  const get_auctions = await redis_client.keys("auction:*");
  get_auctions.forEach(async (auction_key) => {
    const auction_value = await redis_client.hGetAll(auction_key);
    if (new Date(auction_value.start_time).getTime() < now && auction_value.is_active != true) {
      console.log(`${auction_key} needs to start`);
    }
    if (check_ending[auction_value.auction_type]) {
      const needs_ending = await check_ending[auction_value.auction_type](auction_value);
      if (needs_ending) {
        console.log(`${auction_key} needs to end`);
      }
    }
  });
  console.log();
}
async function check_forward_ending(auction_value) {
  if (new Date(auction_value.end_time).getTime() < now && auction_value.is_active == true) {
    return true;
  }
  return false;
}

setInterval(check_auctions, 5_000); //job runs every 5 seconds
