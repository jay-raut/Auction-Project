const { Server } = require("socket.io");

const io = new Server(8081, {
    path: '/api/notification/socket', // Explicitly set the Socket.IO path
});

io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("sendmessage", (message) => {
        console.log(message);
        socket.emit("message", message);
    })
    socket.on("subscribe", (auctionId) => {
        socket.join(`auction_${auctionId}`);
        console.log(`Client ${socket.id} joined auction ${auctionId}`);
    });

    

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});


