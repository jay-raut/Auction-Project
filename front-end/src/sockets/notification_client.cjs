const { io } = require("socket.io-client");

const socket = io("http://localhost", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpheXJhdXQxMSIsInVzZXJfaWQiOiIwODdlYmUyMC1mMWQ5LTRjM2YtYWJkZC1hYWE4ZjFiNjgzNWMiLCJmaXJzdF9uYW1lIjoiSmF5IiwibGFzdF9uYW1lIjoiUmF1dCIsImlhdCI6MTc0MTQxMzIwMiwiZXhwIjoxNzQxNDMxMjAyfQ.iGv2AbdVV-3_ONL9iheQ-FtnVUXT7hjSgj9RQP1aouA`,
  },
});

socket.on("connect_error", (err) => {
  console.log(err);
});

socket.emit("subscribe", "657d7e9d-9e41-479b-b79e-7eeb6a79823a");

socket.on("auction.bid", (bid) => {
  console.log(bid);
});

socket.on("auction.event", (event) => {
  console.log(event);
});
