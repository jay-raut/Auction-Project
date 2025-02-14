require("dotenv").config(); //environment variables
const express = require("express");
const router = express.Router();
const { createProxyMiddleware } = require("http-proxy-middleware");

router.post(
  "/register",
  createProxyMiddleware({
    target: `http://localhost:4000`,
    changeOrigin: true,
  })
);

router.post("/login", async (req, res) => {
  res.status(200).send({ route: "login" });
});

router.post("/logout", async (req, res) => {
  res.status(200).send({ route: "logout" });
});

module.exports = router;
