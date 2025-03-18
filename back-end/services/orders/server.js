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
const max_order_retries = process.env.max_order_retries;
if (!max_order_retries) {
  throw new Error("Cannot get max retries env variable");
}

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
  const { token } = req.cookies;
  if (!token) {
    //check for token
    return res.status(401).json({ messsage: "Missing session token" });
  }

  const requiredFields = {
    payment_details: ["card_number", "name_on_card", "expiration_date"],
    shipping_address: ["street_address", "street_number", "city", "zip_code", "country"],
    billing_address: ["street_address", "street_number", "city", "zip_code", "country"],
  };

  const check_body_valid = Object.entries(requiredFields).every(([key, fields]) => {
    return fields.every((field) => {
      if (!req.body[key] || !req.body[key][field]) {
        return false;
      }
      return true;
    });
  });

  try {
    const verify_result = await order_functions.verify_token(token);
    if (verify_result.status != 200) {
      return res.status(verify_result.status).messsage("Could not verify session. Log in again");
    }
    const order_id = req.params.id;
    if (!order_id) {
      return res.status(400).json({ message: "Missing order id" });
    }
    const payment_result = await order_functions.pay_order(order_id, verify_result.user.user_id, req.body, pool);
    if (payment_result.status == 200) {
      return res.status(200).json({ message: payment_result.message });
    }
    return res.status(payment_result.status).json({ message: payment_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not get order" });
  }
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
const producer = kafka.producer();
const run = async () => {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topics: ["order.create"], fromBeginning: false });
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message, heartbeat }) => {
      const data = JSON.parse(message.value.toString());
      console.log(data);

      try {
        if (data.event_type == "order.create") {
          const order_creation_status = await order_functions.process_order(data, pool);

          if (order_creation_status.status == 200) {
            await producer.send({
              topic: "notification.auction.event",
              messages: [{ value: JSON.stringify({ event_type: "order.ready", user: data.user, order: order_creation_status.order }) }],
            });

            await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + BigInt(1)).toString() }]);
            //commit only on success
          } else {
            console.log("Could not create order");
            const retry_count = data.attempt ? data.attempt : 1;

            if (retry_count < max_order_retries) {
              await producer.send({
                topic: "order.create",
                messages: [{ value: JSON.stringify({ ...data, attempt: retry_count + 1 }) }],
              });
            }
          }
        }
      } catch (error) {
        console.log("Error processing message:", error);
      }

      await heartbeat();
    },
  });
};

run().catch(console.error);
