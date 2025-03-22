require("dotenv").config(); //environment variables
const auction_functions = require("./auction_methods");
const auction_functions_redis = require("./redis_methods");
const auction_event_functions = require("./auction_event_methods");
const { Kafka } = require("kafkajs");

const redis = require("redis");
const express = require("express");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_ADDRESS = process.env.POSTGRES_ADDRESS;
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;

const auction_types = require("./auction_types.json").auction_types;
if (!Array.isArray(auction_types)) {
  throw new Error("Auction types not an array");
}

const create_auction_handlers = {
  //allows for easy calling of auction functions
  dutch_auction: auction_functions.create_dutch_auction,
  forward_auction: auction_functions.create_forward_auction,
};

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  //port tagging for debugging
  console.log(`server got request to ${server_port} for ${req.url}`);
  res.setHeader("auction-Server-Port", server_port);
  next();
});

app.get("/all", async (req, res) => {
  try {
    const get_auctions = await auction_functions.get_all_auctions(pool, redis_client);
    return res.status(200).json({ message: "Got all auctions", auctions: get_auctions.auctions });
  } catch (error) {
    return res.status(400).json({ messag: "Could not get all auctions" });
  }
});

app.get("/all-active", async (req, res) => {
  try {
    const get_auctions = await auction_functions.get_all_auctions(pool, redis_client);
    const get_active_auctions = get_auctions.auctions.filter((auction) => auction.is_active == true);
    return res.status(200).json({ message: "Got all active auctions", auctions: get_active_auctions });
  } catch (error) {
    return res.status(400).json({ messag: "Could not get active auctions" });
  }
});

app.post("/create", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    //check for token
    return res.status(401).json({ messsage: "Missing session token" });
  }

  const { item_name, item_description, auction_type, start_time, starting_amount, shipping_cost, expedited_shipping_cost } = req.body;

  const fields = [item_name, item_description, auction_type, start_time, starting_amount, shipping_cost, expedited_shipping_cost];

  if (fields.some((value) => value === undefined || value === null)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }

  if (!auction_types.includes(auction_type)) {
    return res.status(400).json({ message: "auction type not valid" });
  }

  try {
    const verify_result = await auction_functions.verify_token(token);
    if (verify_result.status != 200) {
      return res.status(verify_result.status).json({ message: "Could not verify session. Log in again" });
    }
    const create_auction_result = await create_auction_handlers[auction_type](redis_client, pool, req.body, verify_result.user);
    if (create_auction_result.status == 200) {
      return res.status(200).json({ message: create_auction_result.message, auction_info: create_auction_result.auction });
    }
    return res.status(create_auction_result.status).json({ message: create_auction_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not create auction" });
  }
});

app.get("/:id", async (req, res) => {
  const param_id = req.params.id;
  if (!param_id) {
    return res.status(400).json({ messsage: "Missing auction id" });
  }
  try {
    const find_auction_result = await auction_functions.get_auction_by_id(param_id, pool, redis_client);
    if (find_auction_result.status == 200) {
      return res.status(200).json({ message: find_auction_result.message, auction: find_auction_result.auction });
    }
    return res.status(find_auction_result.status).json({ message: find_auction_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not find auction" });
  }
});

app.post("/bid/:id", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    //check for token
    return res.status(401).json({ messsage: "Missing session token" });
  }

  const auction_id = req.params.id;
  const { bid } = req.body;
  if (typeof bid !== "number" || isNaN(bid)) {
    return res.status(400).json({ message: "Invalid bid amount" });
  }

  try {
    const verify_result = await auction_functions.verify_token(token);
    if (verify_result.status != 200) {
      return res.status(verify_result.status).json({ message: "Could not verify session. Log in again" });
    }
    const bid_result = await auction_functions_redis.handle_bid(redis_client, auction_id, bid, verify_result.user);
    if (bid_result.status == 200) {
      await producer
        .send({
          topic: "notification.auction.bid",
          messages: [{ key: auction_id, value: JSON.stringify({ event_type: "notification.auction.bid", user: verify_result.user, bid: bid, auction_id: auction_id }) }],
        })
        .catch((error) => console.log(error));
      return res.status(200).json({ message: "bid successful" });
    }
    return res.status(bid_result.status).json({ message: bid_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not bid" });
  }
});

app.get("/search/:query", async (req, res) => {
  const param_query = req.params.query;
  if (!param_query) {
    return res.status(400).json({ messsage: "Missing query" });
  }
  try {
    const find_auction_result = await auction_functions.get_auction_by_name(param_query, pool);
    if (find_auction_result.status == 200) {
      return res.status(200).json({ message: find_auction_result.message, auctions: find_auction_result.auctions });
    }
    return res.status(find_auction_result.status).json({ message: find_auction_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not find auction" });
  }
});

app.post("/buy-now/:id", async (req, res) => {
  //only dutch auction supports this feature but will be made modular such that any auction can support it
  const { token } = req.cookies;
  if (!token) {
    //check for token
    return res.status(401).json({ messsage: "Missing session token" });
  }
  const auction_id = req.params.id;
  if (!auction_id) {
    return res.status(400).json({ messsage: "Missing auction id" });
  }
  try {
    const verify_result = await auction_functions.verify_token(token);
    if (verify_result.status != 200) {
      return res.status(verify_result.status).json({ message: "Could not verify session. Log in again" });
    }
    const buy_now = await auction_functions.buy_now(auction_id, verify_result.user, pool, redis_client, producer);
    if (buy_now.status == 200) {
      return res.status(200).json({ message: buy_now.message });
    }
    return res.status(buy_now.status).json({ message: buy_now.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not buy now on auction" });
  }
});

const server_port = process.env.server_port;
app.listen(server_port, console.log(`Auction server started on port ${server_port}`));

//connecting to redis instance

const redis_client = redis.createClient({
  url: `redis://${process.env.REDIS_ADDRESS}:${[process.env.REDIS_PORT]}`,
});
redis_client.connect();
redis_client.on("connect", () => console.log("Redis connected"));
redis_client.on("error", (err) => console.error("Redis connection error:", err));

const pool = new Pool({
  //for postgres connections
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  host: POSTGRES_ADDRESS,
  port: POSTGRES_PORT,
  database: POSTGRES_DATABASE,
});

//connecting to kafka instance and listening for events
const kafka = new Kafka({ clientId: `auction-service-client-${server_port}`, brokers: [`${process.env.kafka_address}:${process.env.kafka_port}`] });
const consumer = kafka.consumer({
  groupId: "auction-consumers",
  sessionTimeout: 30000,
  heartbeatInterval: 10000,
  maxPollInterval: 300000,
});
const producer = kafka.producer();
const run = async () => {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topics: ["auction.start", "auction.stop"], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());
      try {
        if (data.event_type == "auction.start") {
          console.log(`${JSON.parse(data.auction).auction_id} needs to start`);
          await auction_event_functions.start_auction(JSON.parse(data.auction), pool, redis_client);
        }
        if (data.event_type == "auction.stop") {
          //auction ended and a winner is needed
          console.log(`${JSON.parse(data.auction).auction_id} needs to stop`);
          await auction_event_functions.stop_auction(JSON.parse(data.auction), pool, redis_client, producer);
        }
      } catch (error) {
        //just print for testing
        console.log(error);
      }
    },
  });
};

run().catch(console.error);
