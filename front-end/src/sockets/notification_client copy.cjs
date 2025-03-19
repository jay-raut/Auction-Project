const { subscribe } = require("diagnostics_channel");
const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpheXJhdXQiLCJ1c2VyX2lkIjoiYzZjMjNkZDUtNWM3Ni00NDI4LTk3Y2QtNGI2YTNiYmRhMmMxIiwiZmlyc3RfbmFtZSI6InNvbWVfZmlyc3RfbmFtZSIsImxhc3RfbmFtZSI6InNvbWVfbGFzdF9uYW1lIiwiaWF0IjoxNzQyMzQ3MzE3LCJleHAiOjE3NDIzNjUzMTd9.SZhWk7o1AWPVDEhRcQFaIE_21gG3vKoEk7j1NSfELvE`,
  },
});

socket.on("connect_error", (err) => {
  
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "418a9d30-4c55-43fd-8a1d-8955031e3365")
  console.log("Connected to server");
});

socket.on("auction.bid", (bid) => {
  console.log(bid);
});

socket.on("auction.ended", (event) => {
  console.log(event);
});


socket.on("order.ready", (event) => {
  console.log(event);
});
