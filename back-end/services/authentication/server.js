require("dotenv").config(); //environment variables
const auth_functions = require("./auth_methods.js");
const express = require("express");
const cookieParser = require("cookie-parser");
const { Pool } = require("pg");

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
  res.setHeader("AUTH-Server-Port", server_port);
  next();
});

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
    //credentials for login method
    username,
    password,
  };

  try {
    const login_user = await auth_functions.login(user, pool);
    if (login_user.status == 200) {
      res.cookie("token", login_user.token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 60 * 60 * 1000,
      });
    }
    return res.status(login_user.status).json({ message: login_user.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not login check username or password" });
  }
});

app.post("/change-username", async (req, res) => {
  const { new_username } = req.body;
  const { token } = req.cookies;
  if (!new_username) {
    return res.status(400).json({ messsage: "Missing new username" });
  }
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const username_change_result = await auth_functions.change_username(new_username, decrypted_token.user, pool);

    if (username_change_result.status == 200) {
      //changed success
      res.cookie("token", username_change_result.token, {
        //issue new token in cookie
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 60 * 60 * 1000,
      });
      return res.status(username_change_result.status).json({ message: username_change_result.message });
    }

    return res.status(username_change_result.status).json({ message: username_change_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not change username" });
  }
});

app.post("/change-password", async (req, res) => {
  const { old_password, new_password } = req.body;
  const { token } = req.cookies;
  if (!old_password || !new_password) {
    //checking if request has data
    return res.status(400).json({ messsage: "Missing new or old password" });
  }
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const password_change_result = await auth_functions.change_password(old_password, new_password, decrypted_token.user, pool);
    if (password_change_result.status == 200) {
      //changed success
      res.cookie("token", password_change_result.token, {
        //issue new token in cookie
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 60 * 60 * 1000,
      });
      return res.status(password_change_result.status).json({ message: password_change_result.message });
    }
    return res.status(password_change_result.status).json({ message: password_change_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json("Could not change password");
  }
});

app.post("/verify", async (req, res) => {
  //for internal use, will return a destructured json object with user data
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "No token provided cannot verify" });
  }
  try {
    const result = await auth_functions.verify(token);
    return res.status(result.status).json({ message: result.message, user: result.user });
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
