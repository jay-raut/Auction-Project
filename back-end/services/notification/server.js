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

io.use(async (socket, next) => {
  //middleware for socket auth using jwt
  const get_token = socket.handshake.auth.token;
  if (!get_token) {
    return next(new Error("Token is needed in handshake query"));
  }
  const check_token = await verify_token(get_token);
  if (check_token.status == 200) {
    socket.user = check_token.user;
    return next();
  }
  return next(new Error("Token could not be verified, login again"));
});

let connected_users = new Map();
io.on("connection", (socket) => {
  console.log(`socket connected ${socket.id}`);
  connected_users.set(socket.user.user_id, socket.id);
  socket.on("subscribe", (auction_id) => {
    socket.join(auction_id);
  });

  socket.on("disconnect", () => {
    connected_users.delete(socket.user.user_id);
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

async function verify_token(token) {
  //sends a request to auth_service
  try {
    const verify = await fetch(`http://${process.env.auth_service_address}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
      }),
    });
    if (verify.status == 200) {
      const get_body = await verify.json();
      return { status: verify.status, user: get_body.user };
    }
    return { status: verify.status };
  } catch (error) {
    console.log(error);
    return { status: 500, message: error };
  }
}

async function repeat_message() { //testing stub for removal 
  while (true) {
    await sleep(1000);
    const get_user_socket_id = connected_users.get("087ebe20-f1d9-4c3f-abdd-aaa8f1b6835c");
    io.to(get_user_socket_id).emit("auction.event", "some auction event");
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


start_consumers();
