const { Kafka } = require("kafkajs");
require("dotenv").config({ path: "../.env" });
const kafka = new Kafka({
  clientId: "admin-client",
  brokers: [`${process.env.kafka_address}:${process.env.kafka_port}`],
});

async function create_topic(topic, new_partition_count) {
  const admin = kafka.admin();
  await admin.connect();
  console.log(await admin.listTopics());
  try {
    await admin.createTopics({
      topics: [
        {
          topic: topic,
          numPartitions: new_partition_count,
        },
      ],
    });
  } catch (error) {
    console.log(error);
  } finally {
    await admin.disconnect();
  }
}

create_topic("auction.start", 4);
create_topic("auction.stop", 4);
create_topic("order.create", 4);
create_topic("notification.auction.event", 4);
create_topic("notification.auction.bid", 4);
