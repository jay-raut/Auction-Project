const { io } = require("socket.io-client");

const socket = io("http://localhost", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpheXJhdXQyMSIsInVzZXJfaWQiOiIwYTZhN2IxMy1mZTM4LTRhMjAtOWJkNy0xY2U4MzE2OGE5NGMiLCJmaXJzdF9uYW1lIjoiSmF5IiwibGFzdF9uYW1lIjoiUmF1dCIsImlhdCI6MTc0MTQ1Njg1OSwiZXhwIjoxNzQxNDc0ODU5fQ.y2WqBg4pBqbcmw9ufOsZhKqZWj-I0t8aAhVVvCvIzOQ`,
  },
});

socket.on("connect_error", (err) => {
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "657d7e9d-9e41-479b-b79e-7eeb6a79823a");
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
