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

router.post(
  "/login",
  createProxyMiddleware({
    target: `http://localhost:4000`,
    changeOrigin: true,
  })
);


router.post(
  "/change-username",
  createProxyMiddleware({
    target: `http://localhost:4000`,
    changeOrigin: true,
  })
);

router.post(
  "/change-password",
  createProxyMiddleware({
    target: `http://localhost:4000`,
    changeOrigin: true,
  })
);




module.exports = router;
