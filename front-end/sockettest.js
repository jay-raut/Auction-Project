const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
    path: "/api/notification/socket",
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log("Connected to WebSocket");
});

socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket");
});
