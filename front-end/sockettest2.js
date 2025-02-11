const { io } = require("socket.io-client");

const socket = io("http://localhost", {
  path: "/api/notification/socket",
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to WebSocket");
});

socket.on("message", (message) => {
  console.log(message);
});

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket");
});

socket.emit("subscribe", 123);

async function repeat_message() {
    while(true){
        await sleep(1000);
        socket.emit("sendmessage", "some_message2");
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

repeat_message();
