require("dotenv").config(); //environment variables
const server_port = process.env.server_port;

const express = require("express"); //libraries
const cors = require("cors");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const auction_route = require("./routes/auction_routes");
const notification_route = require("./routes/notification_routes");
const payment_route = require("./routes/payment_routes");
const authentication_routes = require("./routes/authentication_routes");
const app = express();

app.use((req, res, next) => {
  //port tagging for debugging
  console.log(`server got request to ${server_port} for ${req.url}`);
  res.setHeader("API-Server-Port", server_port);
  next();
});

app.use(
  cors({
    origin: ["https://localhost:5173", "http://localhost:5173"],
    credentials: true,
  })
);

app.use("/api/auction", auction_route); //routes
app.use("/api/notification", notification_route);
app.use("/api/payment", payment_route);
app.use("/api/authentication", authentication_routes);

// Create HTTP server (for non-HTTPS connections)
const httpServer = http.createServer(app);
httpServer.listen(server_port, () => {
  console.log(`API HTTP server started on port ${server_port}`);
});

// Only try to create HTTPS server if certificates exist
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'server.key');
const certPath = path.join(certDir, 'server.cert');

// Check if certificates directory and files exist
if (fs.existsSync(certDir) && 
    fs.existsSync(keyPath) && 
    fs.existsSync(certPath)) {
  try {
    const privateKey = fs.readFileSync(keyPath, "utf8");
    const certificate = fs.readFileSync(certPath, "utf8");
    const credentials = { key: privateKey, cert: certificate };

    const httpsServer = https.createServer(credentials, app);
    
    // Use a different port for HTTPS to avoid conflict
    const https_port = parseInt(server_port) + 1000;
    httpsServer.listen(https_port, () => {
      console.log(`API HTTPS server started on port ${https_port}`);
    });
  } catch (error) {
    console.log("HTTPS server not started due to certificate issues:", error.message);
  }
} else {
  console.log("HTTPS server not started: certificates not found in", certDir);
  console.log("Using HTTP server only");
}
