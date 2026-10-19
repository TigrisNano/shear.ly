import amqp, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import { pool } from "./database";
import { retry } from "./retry";

const EXCHANGE_NAME = "shearly.events";
const QUEUE_NAME = "analytics.clicks";
const ROUTING_KEY = "click.registered";

let connection: ChannelModel;
let channel: Channel;

type ClickRegisteredEvent = {
  eventId: string;
  eventType: "ClickRegistered";
  shortCode: string;
  correlationId: string;
  occurredAt: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processClickRegistered(
  event: ClickRegisteredEvent,
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const inserted = await client.query(
      `
      INSERT INTO processed_events (event_id)
      VALUES ($1)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id;
      `,
      [event.eventId],
    );

    if (inserted.rowCount === 0) {
      await client.query("COMMIT");

      console.log(
        JSON.stringify({
          level: "info",
          service: "analytics-consumer",
          event: "duplicate_event_ignored",
          eventId: event.eventId,
          shortCode: event.shortCode,
          correlationId: event.correlationId,
          timestamp: new Date().toISOString(),
        }),
      );

      return false;
    }

    await client.query(
      `
      INSERT INTO analytics_clicks (short_code, click_count)
      VALUES ($1, 1)
      ON CONFLICT (short_code)
      DO UPDATE SET
        click_count = analytics_clicks.click_count + 1;
      `,
      [event.shortCode],
    );

    await client.query("COMMIT");

    console.log(
      JSON.stringify({
        level: "info",
        service: "analytics-consumer",
        event: "click_event_processed",
        eventId: event.eventId,
        shortCode: event.shortCode,
        correlationId: event.correlationId,
        timestamp: new Date().toISOString(),
      }),
    );

    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function startRabbitMQConsumer(): Promise<void> {
  connection = await retry(
    () =>
      amqp.connect(
        process.env.RABBITMQ_URL || {
          hostname: process.env.RABBITMQ_HOST || "127.0.0.1",
          port: Number(process.env.RABBITMQ_PORT || 5672),
          username: process.env.RABBITMQ_USER || "shear",
          password: process.env.RABBITMQ_PASSWORD || "shear_password",
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

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

  await channel.prefetch(1);

  await channel.consume(
    QUEUE_NAME,
    async (message: ConsumeMessage | null) => {
      if (!message) {
        return;
      }

      try {
        const event = JSON.parse(
          message.content.toString(),
        ) as ClickRegisteredEvent;

        console.log(
          JSON.stringify({
            level: "info",
            service: "analytics-consumer",
            event: "click_event_received",
            eventId: event.eventId,
            shortCode: event.shortCode,
            correlationId: event.correlationId,
            timestamp: new Date().toISOString(),
          }),
        );

        const processed = await processClickRegistered(event);

        const crashDelay = Number(process.env.CONSUMER_CRASH_DELAY_MS || 0);

        if (crashDelay > 0) {
          console.log(
            `Waiting ${crashDelay}ms before ACK: eventId=${event.eventId}`,
          );

          await sleep(crashDelay);
        }

        channel.ack(message);

        console.log(
          `ACK sent: eventId=${event.eventId}, processed=${processed}`,
        );
      } catch (error) {
        console.error("Failed to process RabbitMQ message:", error);

        channel.nack(message, false, true);
      }
    },
    {
      noAck: false,
    },
  );

  console.log(`RabbitMQ consumer started: queue=${QUEUE_NAME}`);
}
