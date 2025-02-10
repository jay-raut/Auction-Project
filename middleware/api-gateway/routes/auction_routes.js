const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.status(200).send({ route: "get all auctions" });
});

router.post("/create", async (req, res) => {
  res.status(200).send({ route: "create auction" });
});

router.get("/:id", async (req, res) => {
  res.status(200).json({ route: "auction", auctionId: req.params.id });
});

router.post("/bid/:id", async (req, res) => { //bids on a auction using its id. the bid details will be in request body
    res.status(200).send({route: "bid auction", bid: req.params.id});
})

router.get("/search/:query", async (req, res) => {
    res.status(200).send({route: "search auction", search: req.params.query});
})

module.exports = router;
