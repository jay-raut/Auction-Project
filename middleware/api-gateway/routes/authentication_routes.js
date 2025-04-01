require("dotenv").config(); //environment variables
const express = require("express");
const router = express.Router();
const { createProxyMiddleware } = require("http-proxy-middleware");

router.post(
  "/register",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/login",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/change-username",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/change-password",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/create-address",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/create-payment-method",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.get(
  "/payment",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.get(
  "/address",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.get(
  "/profile",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/logout",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);

router.post(
  "/reset-password",
  createProxyMiddleware({
    target: `http://${process.env.auth_service_address}`,
    changeOrigin: true,
  })
);
module.exports = router;
