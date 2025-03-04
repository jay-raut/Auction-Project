require("dotenv").config(); // Environment variables
const { Kafka } = require("kafkajs");
const redis = require("redis");

const redis_client = redis.createClient({
  url: `redis://${process.env.REDIS_ADDRESS}:${process.env.REDIS_PORT}`,
});
redis_client.connect();
redis_client.on("connect", () => console.log("Redis connected"));
redis_client.on("error", (err) => console.error("Redis connection error:", err));

const kafka = new Kafka({
  clientId: "auction-service-producer",
  brokers: [`${process.env.kafka_address}:${process.env.kafka_port}`],
});
const producer = kafka.producer();

(async () => {
  await producer.connect();
})();

const check_ending = {
  forward_auction: check_forward_ending,
};

var now;
async function check_auctions() {
  now = Date.now();
  const get_auctions = await redis_client.keys("auction:*");

  for (let auction_key of get_auctions) {
    const auction_value = await redis_client.hGetAll(auction_key);
    if (new Date(auction_value.start_time).getTime() < now && auction_value.is_active != true && auction_value.has_ended != true) {
      await notify_auction_start_stop({
        event_type: "auction.start",
        auction: JSON.stringify(auction_value),
      });
    }

    if (check_ending[auction_value.auction_type]) {
      const needs_ending = await check_ending[auction_value.auction_type](auction_value);
      if (needs_ending) {
        await notify_auction_start_stop({
          event_type: "auction.stop",
          auction: JSON.stringify(auction_value),
        });
      }
    }
  }
}

async function check_forward_ending(auction_value) {
  if (new Date(auction_value.end_time).getTime() < now && auction_value.is_active == true && auction_value.has_ended != true) {
    return true;
  }
  return false;
}

async function notify_auction_start_stop(event) {
  const message = { event_type: event.event_type, auction: event.auction, timestamp: new Date().getTime() };
  try {
    await producer.send({
      topic: event.event_type,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
  }
}

setInterval(check_auctions, 2_000); // Job runs every second
