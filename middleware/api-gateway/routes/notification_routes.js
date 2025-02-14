const { Router } = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config(); //environment variables
const router = Router();


const socketProxy = createProxyMiddleware({
    target:  `http://${process.env.notification_service_address}`, 
    changeOrigin: true, 
    ws: true, 
    logLevel: console, 
  });


router.use('/socket', socketProxy);

module.exports = router;
