const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.status(200).send({ route: "notification" });
});

router.get("/ws/auction/:id", async (req, res) => { //subscribes to a certain auction using id
  res.status(200).send({ route: "websocket", auctionid: req.params.id });
});



module.exports = router;
