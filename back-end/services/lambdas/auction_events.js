require("dotenv").config(); //environment variables
const redis = require("redis");

const redis_client = redis.createClient({
  url: `redis://${process.env.REDIS_ADDRESS}:${[process.env.REDIS_PORT]}`,
});
redis_client.connect();
redis_client.on("connect", () => console.log("Redis connected"));
redis_client.on("error", (err) => console.error("Redis connection error:", err));

async function check_auctions() {
  const now = Date.now();
  const get_auctions = await redis_client.keys("auction:*");
  get_auctions.forEach(async (auction_key) => {
    const auction_value = await redis_client.hGetAll(auction_key);
    if (new Date(auction_value.start_time).getTime() < now && auction_value.is_active != true) {
      console.log(auction_key);
    }
  });
  console.log();
}

setInterval(check_auctions, 5_000); //job runs every 5 seconds
