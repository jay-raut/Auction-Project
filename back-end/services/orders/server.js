require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");
const { Kafka } = require("kafkajs");
const order_functions = require("./order_methods");

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_ADDRESS = process.env.POSTGRES_ADDRESS;
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  //port tagging for debugging
  console.log(`server got request to ${server_port} for ${req.url}`);
  res.setHeader("Order-Server-Port", server_port);
  next();
});

const server_port = process.env.server_port;
app.listen(server_port, console.log(`Order server started on port ${server_port}`));

app.get("/all", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    //check for token
    return res.status(401).json({ messsage: "Missing session token" });
  }

  try {
    const verify_result = await order_functions.verify_token(token);
    if (verify_result.status != 200) {
      return res.status(verify_result.status).messsage("Could not verify session. Log in again");
    }

    const get_order_details = await order_functions.get_all_orders(verify_result.user.user_id, pool);
    if (get_order_details.status == 200) {
      return res.status(200).json({ message: get_order_details.message, orders: get_order_details.orders });
    }
    return res.status(get_order_details.status).json({ message: get_order_details.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not get order" });
  }
});

app.get("/get/:id", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    //check for token
    return res.status(401).json({ messsage: "Missing session token" });
  }

  try {
    const verify_result = await order_functions.verify_token(token);
    if (verify_result.status != 200) {
      return res.status(verify_result.status).messsage("Could not verify session. Log in again");
    }

    const order_id = req.params.id;
    if (!order_id) {
      return res.status(400).json({ message: "Missing order id" });
    }
    const get_order_details = await order_functions.get_order_by_id(order_id, verify_result.user.user_id, pool);
    if (get_order_details.status == 200) {
      return res.status(200).json({ message: get_order_details.message, order: get_order_details.order });
    }
    return res.status(get_order_details.status).json({ message: get_order_details.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not get order" });
  }
});

app.post("/submit-payment/:id", async (req, res) => {
  return res.status(200).json({ message: "order payment" });
});

const pool = new Pool({
  //for postgres connections
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  host: POSTGRES_ADDRESS,
  port: POSTGRES_PORT,
  database: POSTGRES_DATABASE,
});

const kafka = new Kafka({ clientId: `orders-service${server_port}`, brokers: [`${process.env.kafka_address}:${process.env.kafka_port}`] });
const consumer = kafka.consumer({ groupId: "order-consumers" });
const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ["order.create"], fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const data = JSON.parse(message.value.toString());
      try {
        if (data.event_type == "order.create") {
          console.log(data);
        }
      } catch (error) {
        console.log(error);
      }
    },
  });
};

run().catch(console.error);
