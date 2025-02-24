require("dotenv").config(); //environment variables
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  //port tagging for debugging
  console.log(`server got request to ${server_port} for ${req.url}`);
  res.setHeader("auction-Server-Port", server_port);
  next();
});

app.get("/", async (req, res) => {
  res.status(200).send({ route: "get all auctions" });
});

app.post("/create", async (req, res) => {
  res.status(200).send({ route: "create auction" });
});

app.get("/:id", async (req, res) => {
  res.status(200).json({ route: "auction", auctionId: req.params.id });
});

app.post("/bid/:id", async (req, res) => { //bids on a auction using its id. the bid details will be in request body
    res.status(200).send({route: "bid auction", bid: req.params.id});
})

app.get("/search/:query", async (req, res) => {
    res.status(200).send({route: "search auction", search: req.params.query});
})

const server_port = process.env.server_port;
app.listen(server_port, console.log(`Auction server started on port ${server_port}`));