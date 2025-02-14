require("dotenv").config(); //environment variables
const express = require("express");
const bcryptjs = require("bcryptjs"); //for hashing passwords
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.jwt_secret;

const app = express();
app.use(express.json());
app.post("/register", async (req, res) => {
  const { username, password, first_name, last_name, street_address, street_number, postal_code, city, country } = req.body;
  const fields = [username, password, first_name, last_name, street_address, street_number, postal_code, city, country];
  
  if (fields.some((value) => !value)) {
    return res.status(400).json({ error: `Missing or undefined field` });
  }
  
  return res.status(200).json({message: "Received data", data: fields});
});
const server_port = process.env.server_port;
app.listen(server_port, console.log(`Authserver started on port ${server_port}`));
