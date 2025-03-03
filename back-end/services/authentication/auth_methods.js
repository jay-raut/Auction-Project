require("dotenv").config(); //environment variables
const bcryptjs = require("bcryptjs"); //for hashing passwords
const jwt = require("jsonwebtoken");

async function create_user(user, address, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const existingUser = await client.query("SELECT username FROM users WHERE username = $1", [user.username]); //check if user already exists

    if (existingUser.rows.length > 0) {
      return { status: 400, message: "Username already exists" };
    }
    const hashed_password = await bcryptjs.hash(user.password, 10); //hash the password

    await client.query("BEGIN"); //start transaction query
    const user_query = "INSERT INTO users(username, password_hash, first_name, last_name) VALUES($1, $2, $3, $4) RETURNING *"; //insert new user
    const user_values = [user.username, hashed_password, user.first_name, user.last_name];
    const user_query_result = await client.query(user_query, user_values);

    //insert new address with foreign key to user
    const address_values = [user_query_result.rows[0].user_id, address.street_address, address.street_number, address.zip_code, address.city, address.country];
    await client.query("INSERT INTO addresses (user_id, street_address, street_number, zip_code, city, country) VALUES ($1, $2, $3, $4, $5, $6)", address_values);
    await client.query("COMMIT"); //end transaction

    return { status: 200, message: "Created user successfully" };
  } catch (error) {
    await client.query("ROLLBACK"); //rollback the commits on failure
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function create_address(user, address, pool_connection) {
  const client = await pool_connection.connect();
  try {
    await client.query("BEGIN"); //start transaction query
    const address_values = [user.user_id, address.street_address, address.street_number, address.zip_code, address.city, address.country];
    await client.query("INSERT INTO addresses (user_id, street_address, street_number, zip_code, city, country) VALUES ($1, $2, $3, $4, $5, $6)", address_values);
    await client.query("COMMIT"); //end transaction
    return { status: 200, message: "Added new address successfully" };
  } catch (error) {
    await client.query("ROLLBACK"); //rollback the commits on failure
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function create_payment_method(user, payment_method, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const { card_number, name_on_card, expiration_date } = payment_method;
    await client.query("BEGIN");
    const payment_values = [user.user_id, card_number, name_on_card, expiration_date];
    await client.query("INSERT INTO payment_methods (user_id, card_number, name_on_card, expiration_date) VALUES ($1, $2, $3, $4)", payment_values);
    await client.query("COMMIT");
    return { status: 200, message: "Added new payment method successfully" };
  } catch (error) {
    await client.query("ROLLBACK"); //rollback the commits on failure
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function login(user, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const get_user = await client.query("SELECT * FROM users WHERE username = $1", [user.username]); //get user
    if (get_user.rows.length != 1) {
      //check if user exists
      return { status: 400, message: "Could not login check username or password" };
    }

    const isPasswordValid = await bcryptjs.compare(user.password, get_user.rows[0].password_hash);
    if (!isPasswordValid) {
      //check password
      return { status: 400, message: "Could not login check username or password" };
    }
    const token = {
      //generate token
      username: get_user.rows[0].username,
      user_id: get_user.rows[0].user_id,
      first_name: get_user.rows[0].first_name,
      last_name: get_user.rows[0].last_name,
    };

    const jwt_token = sign_token(token); //sign token
    return { status: 200, message: "Login successful", token: jwt_token };
  } catch (error) {
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function change_username(new_username, user, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const existingUser = await client.query("SELECT username FROM users WHERE username = $1", [new_username]);
    if (existingUser.rows.length > 0) {
      return { status: 400, message: "Username already exists" };
    }

    await client.query("BEGIN");
    const query = "UPDATE users SET username = $1 WHERE username = $2 RETURNING username";
    const result = await client.query(query, [new_username, user.username]);

    if (result.rows.length === 0) {
      throw new Error("Result length 0");
    }
    const token = {
      username: new_username,
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    const new_token = sign_token(token);
    await client.query("COMMIT");
    return { status: 200, message: "Changed username", token: new_token };
  } catch (error) {
    await client.query("ROLLBACK"); //rollback the commits on failure
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function change_password(old_password, new_password, user, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const get_user = await client.query("SELECT * FROM users WHERE username = $1", [user.username]);
    if (get_user.rows.length != 1) {
      //check if user exists
      return { status: 400, message: "Username doesn't exist" };
    }

    const isPasswordValid = await bcryptjs.compare(old_password, get_user.rows[0].password_hash);
    if (!isPasswordValid) {
      //check password
      return { status: 400, message: "Incorrect password" };
    }
    await client.query("BEGIN");

    const query = "UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING username";
    const hashed_password = await bcryptjs.hash(new_password, 10);
    const result = await client.query(query, [hashed_password, user.username]);

    if (result.rows.length === 0) {
      throw new Error("Result length 0");
    }
    const token = {
      username: user.username,
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    const new_token = sign_token(token);
    await client.query("COMMIT");
    return { status: 200, message: "Changed password", token: new_token };
  } catch (error) {
    await client.query("ROLLBACK"); //rollback the commits on failure
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function verify(token) {
  //verifies a request using the token. If valid returns token content
  try {
    const verify_result = jwt.verify(token, process.env.jwt_secret);
    return { status: 200, message: "Verified", user: verify_result };
  } catch (error) {
    console.log(error);
    return { status: 401, message: "Could not verify token" };
  }
}

function sign_token(token) {
  //signs a token using key in env
  return jwt.sign(token, process.env.jwt_secret, { expiresIn: "5hr" });
}

module.exports = { create_user, login, verify, sign_token, change_password, change_username, create_address, create_payment_method };
