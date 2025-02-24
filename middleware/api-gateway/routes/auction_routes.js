const express = require("express");
const router = express.Router();
require("dotenv").config('../.env'); //environment variables
const { createProxyMiddleware } = require("http-proxy-middleware");

router.get(
  "/",
  createProxyMiddleware({
    target: `http://${process.env.auction_service_address}`,
    changeOrigin: true,
  })
);
//auth service checking needed still
router.post(
  "/create",
  createProxyMiddleware({
    target: `http://${process.env.auction_service_address}`,
    changeOrigin: true,
  })
);

router.get(
  "/:id",
  createProxyMiddleware({
    target: `http://${process.env.auction_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/bid/:id",
  createProxyMiddleware({
    target: `http://${process.env.auction_service_address}`,
    changeOrigin: true,
  })
);

router.get(
  "/search/:query",
  createProxyMiddleware({
    target: `http://${process.env.auction_service_address}`,
    changeOrigin: true,
  })
);

module.exports = router;
