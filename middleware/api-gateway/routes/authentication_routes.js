const express = require("express");
const router = express.Router();

router.post("/register", async (req, res) => {
  res.status(200).send({ route: "register" });
});

router.post("/login", async (req, res) => {
  res.status(200).send({ route: "login" });
});

router.post("/logout", async (req, res) => {
  res.status(200).send({ route: "logout" });
});

module.exports = router;
