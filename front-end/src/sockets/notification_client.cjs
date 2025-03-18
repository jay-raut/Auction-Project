const { subscribe } = require("diagnostics_channel");
const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNvbWV1c2VyIiwidXNlcl9pZCI6IjVkZDk1OTg2LTkzYzUtNDJlZC1hODkyLTc3NTEyNTM2OWM5NCIsImZpcnN0X25hbWUiOiJzb21lX2ZpcnN0X25hbWUiLCJsYXN0X25hbWUiOiJzb21lX2xhc3RfbmFtZSIsImlhdCI6MTc0MjI2MTIzMCwiZXhwIjoxNzQyMjc5MjMwfQ.tveM3isOkkjR-fRO66sVOBU1oXnl5Rw4xm3vtB-L7YM`,
  },
});

socket.on("connect_error", (err) => {
  
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "cd9d1fe8-1300-4427-8768-7297821c2b96")
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
