require("dotenv").config(); // Load environment variables
const { Kafka } = require("kafkajs");
const redis = require("redis");

const redis_client = redis.createClient({
  url: `redis://${process.env.REDIS_ADDRESS}:${process.env.REDIS_PORT}`,
});

async function connect_redis() {
  try {
    await redis_client.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection error:", err);
    setTimeout(connect_redis, 5000);
  }
}

redis_client.on("error", (err) => {
  console.error("Redis connection error:", err);
  if (err.code === "ECONNRESET") {
    console.log("Reconnecting to Redis...");
    connect_redis();
  }
});
connect_redis();

const kafka = new Kafka({
  clientId: "auction-service-producer",
  brokers: [`${process.env.kafka_address}:${process.env.kafka_port}`],
});

const producer = kafka.producer();

async function connect_kafka() {
  try {
    await producer.connect();
    console.log("Kafka connected");
  } catch (err) {
    console.error("Kafka connection error:", err);
    setTimeout(connect_kafka, 5000);
  }
}
connect_kafka();

const check_ending = {
  forward_auction: check_forward_ending,
};

async function check_auctions() {
  try {
    const now = Date.now();
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
  } catch (err) {
    console.error("Error in check_auctions:", err);
  }
}

async function check_forward_ending(auction_value) {
  const now = Date.now();
  return new Date(auction_value.end_time).getTime() < now && auction_value.is_active == true && auction_value.has_ended != true;
}

async function notify_auction_start_stop(event) {
  const message = { event_type: event.event_type, auction: event.auction, timestamp: Date.now() };
  try {
    await producer.send({
      topic: event.event_type,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("Error sending message to Kafka:", error);
    connect_kafka(); 
  }
}

setInterval(check_auctions, 2000);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
