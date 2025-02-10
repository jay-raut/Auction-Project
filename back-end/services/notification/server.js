const { Server } = require("socket.io");
const io = new Server(8081, {
    cors: { origin: "*" } // Allow all origins (change for security)
});

console.log("Socket.IO server running on port 8081");

io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("subscribe", (auctionId) => {
        socket.join(`auction_${auctionId}`);
        console.log(`Client ${socket.id} joined auction ${auctionId}`);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});
