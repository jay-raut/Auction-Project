const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  path: "/api/notification/socket",
  transports: ["websocket"],
  auth: {
    token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNvbWV1c2VyIiwidXNlcl9pZCI6ImI3NGVkNWRjLTEzZDEtNDFiMi05ZWU2LTExZGQ5MTFmZWM5NSIsImZpcnN0X25hbWUiOiJzb21lX2ZpcnN0X25hbWUiLCJsYXN0X25hbWUiOiJzb21lX2xhc3RfbmFtZSIsImlhdCI6MTc0MTgxOTA5NCwiZXhwIjoxNzQxODM3MDk0fQ.P9xmfUXT-QCr7i_W4acOdR4dUoRu-TV6-zuNsEJo_T4`,
  },
});

socket.on("connect_error", (err) => {
  console.log(err);
});

socket.on("connect", () => {
  socket.emit("subscribe", "all");
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
