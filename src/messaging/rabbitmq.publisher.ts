import amqp, { Channel, ChannelModel } from "amqplib";
import { env } from "../config/env";
import { retry } from "../utils/retry";
import { CircuitBreaker } from "../utils/circuit-breaker";

const EXCHANGE_NAME = "shearly.events";
const ROUTING_KEY = "click.registered";

const rabbitMQCircuit = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 10_000,
});

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  connection = await retry(
    () =>
      amqp.connect(
        process.env.RABBITMQ_URL || {
          hostname: env.rabbitmq.host,
          port: env.rabbitmq.port,
          username: env.rabbitmq.user,
          password: env.rabbitmq.password,
        },
        {
          timeout: 5000,
        },
      ),
    {
      maxAttempts: 3,
      baseDelayMs: 200,
      maxDelayMs: 2000,
    },
  );

  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "direct", {
    durable: true,
  });

  return channel;
}

export async function publishClickRegistered(
  shortCode: string,
  correlationId: string,
): Promise<void> {
  await rabbitMQCircuit.execute(async () => {
    const channel = await getChannel();

    const event = {
      eventId: crypto.randomUUID(),
      eventType: "ClickRegistered",
      shortCode,
      correlationId,
      occurredAt: new Date().toISOString(),
    };

    const accepted = channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
      },
    );

    if (!accepted) {
      throw new Error("RabbitMQ write buffer is full");
    }

    console.log("Published ClickRegistered:", JSON.stringify(event));
  });
}
