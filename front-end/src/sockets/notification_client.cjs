const { subscribe } = require("diagnostics_channel");
const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNvbWV1c2VyIiwidXNlcl9pZCI6IjVkZDk1OTg2LTkzYzUtNDJlZC1hODkyLTc3NTEyNTM2OWM5NCIsImZpcnN0X25hbWUiOiJzb21lX2ZpcnN0X25hbWUiLCJsYXN0X25hbWUiOiJzb21lX2xhc3RfbmFtZSIsImlhdCI6MTc0MTkyMDE1NywiZXhwIjoxNzQxOTM4MTU3fQ.GxkkBsN1sv5hn1kxW-AaFpucCtfQReC-539eGhqUX7w`,
  },
});

socket.on("connect_error", (err) => {
  subscribe.emit("subscribe", "8b20d8da-e812-4880-a227-80f4f1b0cf03")
  console.log(err);
});

socket.on("connect", () => {
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
