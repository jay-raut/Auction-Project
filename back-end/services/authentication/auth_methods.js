require("dotenv").config(); //environment variables
const bcryptjs = require("bcryptjs"); //for hashing passwords
const jwt = require("jsonwebtoken");

async function create_user(user, address, pool_connection) {
  const client = await pool_connection.connect();
  try {
    const existingUser = await client.query("SELECT username FROM users WHERE username = $1", [user.username]);

    if (existingUser.rows.length > 0) {
      return { status: 400, message: "Username already exists" };
    }
    const hashed_password = await bcryptjs.hash(user.password, 10);

    await client.query("BEGIN");
    const user_query = "INSERT INTO users(username, password_hash, first_name, last_name) VALUES($1, $2, $3, $4) RETURNING *";
    const user_values = [user.username, hashed_password, user.first_name, user.last_name];
    const user_query_result = await client.query(user_query, user_values);

    const address_values = [user_query_result.rows[0].user_id, address.street_address, address.street_number, address.zip_code, address.city, address.country];
    await client.query("INSERT INTO addresses (user_id, street_address, street_number, zip_code, city, country) VALUES ($1, $2, $3, $4, $5, $6)", address_values);
    await client.query("COMMIT");

    return { status: 200, message: "Created user successfully" };
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
    const get_user = await client.query("SELECT * FROM users WHERE username = $1", [user.username]);
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
      username: get_user.rows[0].username,
      user_id: get_user.rows[0].user_id,
      first_name: get_user.rows[0].first_name,
      last_name: get_user.rows[0].last_name,
    };

    const jwt_token = jwt.sign(token, process.env.jwt_secret, { expiresIn: "5hr" });
    return { status: 200, message: "Login successful", token: jwt_token };
  } catch (error) {
    throw new Error(error);
  } finally {
    client.release();
  }
}

async function verify(token) {
  try {
    const verify_result = jwt.verify(token, process.env.jwt_secret);
    console.log(verify_result);
    return { status: 200, message: "Verified" };
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = { create_user, login, verify };
