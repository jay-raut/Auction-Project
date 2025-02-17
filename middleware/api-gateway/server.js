require("dotenv").config(); //environment variables
const server_port = process.env.server_port;

const express = require("express"); //libraries
const auction_route = require("./routes/auction_routes");
const notification_route = require("./routes/notification_routes");
const payment_route = require("./routes/payment_routes");
const authentication_routes = require("./routes/authentication_routes");
const app = express();

app.use((req, res, next) => {
  //port tagging for debugging
  console.log(`server got request to ${server_port} for ${req.url}`)
  res.setHeader("API-Server-Port", server_port);
  next();
});

app.use("/api/auction", auction_route); //routes
app.use("/api/notification", notification_route);
app.use("/api/payment", payment_route);
app.use("/api/authentication", authentication_routes);

app.listen(server_port, console.log(`API server started on port ${server_port}`));
