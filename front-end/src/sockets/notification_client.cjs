const { subscribe } = require("diagnostics_channel");
const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNvbWV1c2VyIiwidXNlcl9pZCI6IjVkZDk1OTg2LTkzYzUtNDJlZC1hODkyLTc3NTEyNTM2OWM5NCIsImZpcnN0X25hbWUiOiJzb21lX2ZpcnN0X25hbWUiLCJsYXN0X25hbWUiOiJzb21lX2xhc3RfbmFtZSIsImlhdCI6MTc0MjM0NjQ2NywiZXhwIjoxNzQyMzY0NDY3fQ.4EgQYf7VfvdZgooJhnpi9GoMr4ZACFJAqhHHdVoePfs`,
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
