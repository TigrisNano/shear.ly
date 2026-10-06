import amqp, { Channel, ChannelModel } from "amqplib";
import { env } from "../config/env";

const EXCHANGE_NAME = "shearly.events";
const ROUTING_KEY = "click.registered";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect({
    hostname: env.rabbitmq.host,
    port: env.rabbitmq.port,
    username: env.rabbitmq.user,
    password: env.rabbitmq.password,
  });

  channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "direct", {
    durable: true,
  });

  return channel;
}

export async function publishClickRegistered(shortCode: string): Promise<void> {
  const channel = await getChannel();

  const event = {
    eventId: crypto.randomUUID(),
    eventType: "ClickRegistered",
    shortCode,
    occurredAt: new Date().toISOString(),
  };

  channel.publish(
    EXCHANGE_NAME,
    ROUTING_KEY,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json",
    },
  );

  console.log("Published ClickRegistered:", event);
}
