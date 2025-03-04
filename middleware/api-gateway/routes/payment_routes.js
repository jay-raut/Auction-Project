const express = require("express");
const router = express.Router();
const { createProxyMiddleware } = require("http-proxy-middleware");

router.get(
  "/get/:id",
  createProxyMiddleware({
    target: `http://${process.env.payment_service_address}`,
    changeOrigin: true,
  })
);

router.get(
  "/all",
  createProxyMiddleware({
    target: `http://${process.env.payment_service_address}`,
    changeOrigin: true,
  })
);
router.post(
  "/submit-payment/:id",
  createProxyMiddleware({
    target: `http://${process.env.payment_service_address}`,
    changeOrigin: true,
  })
);

module.exports = router;
