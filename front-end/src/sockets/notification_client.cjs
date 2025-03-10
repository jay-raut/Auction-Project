const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpheXJhdXQiLCJ1c2VyX2lkIjoiYmY2NTg0MTYtMjQ1Ny00MzFlLTlmODItY2VmZjZjNmM2NjdlIiwiZmlyc3RfbmFtZSI6ImpheSIsImxhc3RfbmFtZSI6InJhdXQiLCJpYXQiOjE3NDE1ODYwMDAsImV4cCI6MTc0MTYwNDAwMH0.uLJjNhKRvS-aEIpMHg4yGUeK0kEXis-XpBHjFe0xSvE`,
  },
});

socket.on("connect_error", (err) => {
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "995e6fe5-877a-4c30-9c02-30658c2eed3f");
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
