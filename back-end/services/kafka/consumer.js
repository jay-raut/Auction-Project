const { Kafka } = require("kafkajs");

const kafka = new Kafka({ clientId: "auction-service", brokers: ["localhost:29092"] });
const consumer = kafka.consumer({ groupId: "auction-consumers" });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "notify-auction", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`Received (Partition: ${partition}) - Auction ${data.auctionId}: $${data.bidAmount}`);
    },
  });
};

run().catch(console.error);
