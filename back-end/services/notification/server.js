require("dotenv").config(); //environment variables
const { Server } = require("socket.io");
const { Kafka } = require("kafkajs");
const server_port = process.env.server_port;
const io = new Server(server_port, {
  path: "/api/notification/socket", // Explicitly set the Socket.IO path
});

const kafka = new Kafka({ clientId: `notification-service-${server_port}`, brokers: [`${process.env.kafka_address}:${process.env.kafka_port}`] });
const auction_event_consumer = kafka.consumer({
  groupId: "auction-event-consumers",
});

const auction_bid_consumer = kafka.consumer({
  groupId: "auction-bid-consumers",
});

io.on("connection", (socket) => {
  console.log(`socket connected ${socket.id}`);
  socket.on("subscribe", (auction_id) => {
    socket.join(auction_id);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

async function start_consumers() {
  await auction_event_consumer.connect();
  await auction_bid_consumer.connect();

  await auction_event_consumer.subscribe({ topic: "notification.auction.event", fromBeginning: true }); //start at the beginning such that new instances can be synced
  await auction_bid_consumer.subscribe({ topic: "notification.auction.bid", fromBeginning: false }); //do not start at the beginning

  auction_event_consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const get_event = JSON.parse(message.value.toString());
      console.log(`${get_event} auction event`);
    },
  });

  auction_bid_consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(data);
      const bid_message = {
        bid: data.bid,
        user: {
          username: data.user.username,
          user_id: data.user.user_id,
        },
        auction_id: data.auction_id,
      };
      io.to(data.auction_id).emit("auction.bid", bid_message);
    },
  });
}

start_consumers();
