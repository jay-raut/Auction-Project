const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNvbWV1c2VyIiwidXNlcl9pZCI6IjA1YWFmZmE4LTA2NzYtNGQ3Ni1iYzE1LTk5YWRiYTljNmZhNiIsImZpcnN0X25hbWUiOiJzb21lX2ZpcnN0X25hbWUiLCJsYXN0X25hbWUiOiJzb21lX2xhc3RfbmFtZSIsImlhdCI6MTc0MTkxODcyOCwiZXhwIjoxNzQxOTM2NzI4fQ.pfO450mk3AEta_PnRiw2dxmGyKS0ZSZxhp3vNgNDcxc`,
  },
});

socket.on("connect_error", (err) => {
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "ee2f9a7d-9e8b-4c18-bd71-e56be18f7941")
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
