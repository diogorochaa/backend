import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, {
  type AmqpConnectionManager,
  type ChannelWrapper,
} from "amqp-connection-manager";
import type { Channel } from "amqplib";
import { DOMAIN_EVENTS_EXCHANGE } from "./constants";
import { createEventEnvelope } from "./event-envelope";

@Injectable()
export class EventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisher.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) {
      this.logger.warn("RABBITMQ_URL não definida — eventos desabilitados");
      return;
    }

    this.enabled = true;
    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: Channel) => {
        await ch.assertExchange(DOMAIN_EVENTS_EXCHANGE, "topic", {
          durable: true,
        });
      },
    });

    this.connection.on("connect", () =>
      this.logger.log("Conectado ao RabbitMQ (publisher)"),
    );
    this.connection.on("disconnect", () =>
      this.logger.warn("Desconectado do RabbitMQ (publisher)"),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish<T extends object>(
    routingKey: string,
    payload: T,
    metadata?: { correlationId?: string; source?: string },
  ): Promise<void> {
    if (!this.enabled || !this.channel) {
      this.logger.debug(`Evento ignorado (sem RabbitMQ): ${routingKey}`);
      return;
    }

    const envelope = createEventEnvelope(routingKey, payload, {
      source: metadata?.source ?? this.config.get<string>("npm_package_name"),
      correlationId: metadata?.correlationId,
    });

    await this.channel.publish(DOMAIN_EVENTS_EXCHANGE, routingKey, envelope, {
      persistent: true,
      contentType: "application/json",
    });

    this.logger.log(`Publicado: ${routingKey} (v${envelope.version})`);
  }
}
