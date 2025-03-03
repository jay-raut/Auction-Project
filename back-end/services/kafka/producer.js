const { Kafka } = require("kafkajs");

const kafka = new Kafka({ clientId: "auction-service", brokers: ["localhost:29092"] });
const producer = kafka.producer();

const sendBidEvent = async (auctionId, bidAmount, userId, usePartitionKey = false) => {
  const message = {
    key: usePartitionKey ? auctionId : undefined,  // Use auctionId as key if partitioning is needed
    value: JSON.stringify({ auctionId, bidAmount, userId }),
  };

  await producer.send({
    topic: "notify-auction",
    messages: [message],
  });

  console.log(`Sent bid event: Auction ${auctionId}, Bid: $${bidAmount}`);
};

const run = async () => {
  await producer.connect();

  for (let i = 0; i < 10; i++) {
    await sendBidEvent("auction123", i, "user456", false); // Without partition key
  }

  for (let i = 0; i < 10; i++) {
    await sendBidEvent("auction456", i, "user456", true); // With partition key
  }

  await producer.disconnect();
};

run();
