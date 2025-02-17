require("dotenv").config(); //environment variables
const postgresFunctions = require("./postgres_methods.js");
const express = require("express");

const { Client, Pool } = require("pg");
const jwt_secret = process.env.jwt_secret;

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_ADDRESS = process.env.POSTGRES_ADDRESS;
const POSTGRES_PORT = process.env.POSTGRES_PORT;
const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;

const app = express();
app.use(express.json());

app.post("/register", async (req, res) => {
  const { username, password, first_name, last_name, street_address, street_number, zip_code, city, country } = req.body;
  const fields = [username, password, first_name, last_name, street_address, street_number, zip_code, city, country];

  if (fields.some((value) => !value)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }
  const userData = {
    username,
    password,
    first_name,
    last_name,
  };

  const addressData = {
    street_address,
    street_number,
    zip_code,
    city,
    country,
  };
  try {
    const create_user_status = await postgresFunctions.create_user(userData, addressData, pool);
    return res.status(create_user_status.status).json({ message: create_user_status.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Something went wrong try again" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const fields = [username, password];

  if (fields.some((value) => !value)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }
  const user = {
    username,
    password,
  };

  try {
    const login_user = await postgresFunctions.login(user, pool);
    return res.status(login_user.status).json({ message: login_user.message, token: login_user.token });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not login check username or password" });
  }
});

app.post("/logout", async (req, res) => {
  const { username, password } = req.body;
  const fields = [username, password];
  if (fields.some((value) => !value)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }

  return res.status(200).json({ message: "Received data", data: req.body });
});

app.post("/verify", async (req, res) => {
  return res.status(200).json({ message: "verify request" });
});

const server_port = process.env.server_port;
app.listen(server_port, console.log(`Authserver started on port ${server_port}`));

const pool = new Pool({
  //for postgres connections
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  host: POSTGRES_ADDRESS,
  port: POSTGRES_PORT,
  database: POSTGRES_DATABASE,
});
