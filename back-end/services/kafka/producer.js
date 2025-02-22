const { Kafka } = require("kafkajs");

const kafka = new Kafka({ clientId: "auction-service", brokers: ["localhost:29092"] });
const producer = kafka.producer();

const sendBidEvent = async (auctionId, bidAmount, userId) => {
  await producer.connect();
  const partitionKey = auctionId;

  await producer.send({
    topic: "notify-auction",
    messages: [{ value: JSON.stringify({ auctionId, bidAmount, userId }) }],
  });

  console.log(`Sent bid event: Auction ${auctionId}, Bid: $${bidAmount}`);
  await producer.disconnect();
};

// Example usage
for (var i = 0; i < 10; i++) {
  sendBidEvent("auction123", i, "user456");
}
