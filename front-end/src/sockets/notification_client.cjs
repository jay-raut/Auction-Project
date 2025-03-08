const { io } = require("socket.io-client");

const socket = io("http://localhost", {
  path: "/api/notification/socket",
  transports: ["websocket"],
});

socket.emit("subscribe", "657d7e9d-9e41-479b-b79e-7eeb6a79823a");

socket.on("auction.bid", (bid) => {
  console.log(bid);
});
