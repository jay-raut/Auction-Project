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
    if (create_user_status.status == 200) {
      res.cookie("token", create_user_status.token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 60 * 60 * 1000,
      });
    }
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
        sameSite: "strict",
        httpOnly: "true",
        maxAge: 5 * 60 * 60 * 1000,
      });
    }
    return res.status(login_user.status).json({ message: login_user.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not login check username or password" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, path: "/" });
  res.status(200).send({ message: "Logged out successfully" });
});

app.get("/profile", async (req, res) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }
  try {
    const verify = await auth_functions.verify(token);
    if (verify.status == 200) {
      return res.status(200).json({ message: verify.message, user: verify.user });
    }
    return res.status(verify.status).json({ message: verify.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Could not verify user" });
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

app.post("/change-profile-name", async (req, res) => {
  const { first_name, last_name } = req.body;
  const { token } = req.cookies;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }

  if (!first_name || !last_name) {
    return res.status(400).json({ messsage: "Missing first or last name" });
  }

  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const new_profile_name = { first_name: first_name, last_name: last_name };
    const profile_name_change = await auth_functions.change_profile_name(new_profile_name, decrypted_token.user, pool);

    if (profile_name_change.status == 200) {
      //changed success
      res.cookie("token", profile_name_change.token, {
        //issue new token in cookie
        httpOnly: true,
        sameSite: "strict",
        maxAge: 5 * 60 * 60 * 1000,
      });
      return res.status(profile_name_change.status).json({ message: profile_name_change.message });
    }

    return res.status(profile_name_change.status).json({ message: profile_name_change.message });
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

app.post("/reset-password", async (req, res) => {
  const { username, new_password } = req.body;
  if (!username || !new_password) {
    //checking if request has data
    return res.status(400).json({ messsage: "Missing new or old password" });
  }

  try {
    const password_change_result = await auth_functions.reset_password(username, new_password, pool);
    return res.status(password_change_result.status).json({ message: password_change_result.message });
  } catch (error) {
    console.log(error);
    return res.status(400).json("Could not reset password");
  }
});

app.post("/create-address", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  const { street_address, street_number, zip_code, city, country } = req.body;
  const fields = [street_address, street_number, zip_code, city, country];

  if (fields.some((value) => !value)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }

  const addressData = {
    street_address,
    street_number,
    zip_code,
    city,
    country,
  };

  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const create_address_status = await auth_functions.create_address(decrypted_token.user, addressData, pool);
    return res.status(create_address_status.status).json({ message: create_address_status.message });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not create new address" });
  }
});

app.post("/create-payment-method", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  const { card_number, name_on_card, expiration_date } = req.body;
  const fields = [card_number, name_on_card, expiration_date];
  if (fields.some((value) => !value)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }
  const { year, month } = expiration_date;
  if (!year || !month) {
    return res.status(400).json({ error: `Missing or undefined field in expiration` });
  }

  const paymentData = {
    card_number,
    name_on_card,
    expiration_date,
  };
  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const create_payment_result = await auth_functions.create_payment_method(decrypted_token.user, paymentData, pool);
    return res.status(create_payment_result.status).json({ message: create_payment_result.message });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not create payment method" });
  }
});

app.get("/payment", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const get_payment_methods = await auth_functions.get_payment_methods(decrypted_token.user, pool);
    if (get_payment_methods.status == 200) {
      return res.status(200).json({ message: get_payment_methods.message, payments: get_payment_methods.payments });
    }
    return res.status(get_payment_methods.status).json({ message: get_payment_methods.message });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not get payment methods" });
  }
});

app.get("/address", async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const get_addresses = await auth_functions.get_addresses(decrypted_token.user, pool);
    if (get_addresses.status == 200) {
      return res.status(200).json({ message: get_addresses.message, addresses: get_addresses.addresses });
    }
    return res.status(get_addresses.status).json({ message: get_addresses.message });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not get payment methods" });
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

app.delete("/payment", async (req, res) => {
  const { token } = req.cookies;
  const { payment_method_id } = req.body;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }

  if (!payment_method_id) {
    return res.status(400).json({ message: "Missing payment id" });
  }

  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const delete_payment_method = await auth_functions.delete_payment(decrypted_token.user, payment_method_id, pool);
    return res.status(delete_payment_method.status).json({ message: delete_payment_method.message });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not delete payment method" });
  }
});

app.delete("/address", async (req, res) => {
  const { token } = req.cookies;
  const { address_id } = req.body;
  if (!token) {
    return res.status(400).json({ messsage: "Missing session token" });
  }
  if (!address_id) {
    return res.status(400).json({ message: "Missing address id" });
  }

  try {
    const decrypted_token = await auth_functions.verify(token);
    if (decrypted_token.status != 200) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const delete_address_result = await auth_functions.delete_address(decrypted_token.user, address_id, pool);
    return res.status(delete_address_result.status).json({ message: delete_address_result.message });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not delete address" });
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
