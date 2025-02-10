const { Router } = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const router = Router();



const socketProxy = createProxyMiddleware({
    target: 'http://localhost:8081', 
    changeOrigin: true, 
    ws: true, 
    logLevel: console, 
  });


router.use('/socket', socketProxy);

module.exports = router;
