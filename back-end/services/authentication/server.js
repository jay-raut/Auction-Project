require("dotenv").config(); //environment variables
const auth_functions = require("./auth_methods.js");
const express = require("express");

const { Pool } = require("pg");

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
    const create_user_status = await auth_functions.create_user(userData, addressData, pool);
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
    const login_user = await auth_functions.login(user, pool);
    res.cookie("token", login_user.token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 5 * 60 * 60 * 1000,
    });
    return res.status(login_user.status).json({ message: login_user.message });
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

app.get("/verify", async (req, res) => {
  //for internal use
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ message: "No token provided cannot verify" });
  }
  try {
    const result = await auth_functions.verify(token);
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
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
