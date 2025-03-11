const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpheXJhdXQiLCJ1c2VyX2lkIjoiZDFkYzhhZmEtYmI4MS00ZDcyLTg1NDEtOGU2MzNmZTA5ODMwIiwiZmlyc3RfbmFtZSI6ImpheSIsImxhc3RfbmFtZSI6InJhdXQiLCJpYXQiOjE3NDE2MzQ5MjgsImV4cCI6MTc0MTY1MjkyOH0.mcv6-Dwnlysg0dIm-1JmUB-8Lj4ZM4RcWPsgQ3tDElA`,
  },
});

socket.on("connect_error", (err) => {
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "72d607eb-e5bc-498b-9481-b50bbf197ebd");
  console.log("Connected to server");
});

socket.on("auction.bid", (bid) => {
  console.log(bid);
});

socket.on("auction.ended", (event) => {
  console.log(event);
});
``

socket.on("order.ready", (event) => {
  console.log(event);
});
