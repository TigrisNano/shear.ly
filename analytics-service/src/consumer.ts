import "./instrumentation";

import "dotenv/config";

import { startRabbitMQConsumer } from "./rabbitmq.consumer";

startRabbitMQConsumer().catch((error) => {
  console.error("Failed to start RabbitMQ consumer:", error);
  process.exit(1);
});
