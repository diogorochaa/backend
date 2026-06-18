import {
  Inject,
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
import type { Channel, ConsumeMessage } from "amqplib";
import { DOMAIN_EVENTS_EXCHANGE } from "./constants";
import {
  UnsupportedEventVersionError,
  unwrapEventPayload,
} from "./event-envelope";

export const MESSAGING_CONSUMER_OPTIONS = Symbol("MESSAGING_CONSUMER_OPTIONS");

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface MessagingConsumerOptions {
  /** Nome único do serviço (ex: orders-service) — vira nome da fila */
  serviceName: string;
  /** Routing keys para bind (ex: user.created, user.*) */
  bindings: string[];
}

@Injectable()
export class EventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumer.name);
  private connection: AmqpConnectionManager | null = null;
  private channel: ChannelWrapper | null = null;
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(
    private readonly config: ConfigService,
    @Inject(MESSAGING_CONSUMER_OPTIONS)
    private readonly options: MessagingConsumerOptions,
  ) {}

  subscribe<T>(routingKey: string, handler: EventHandler<T>): void {
    const list = this.handlers.get(routingKey) ?? [];
    list.push(handler as EventHandler);
    this.handlers.set(routingKey, list);
  }

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>("RABBITMQ_URL");
    if (!url) {
      this.logger.warn("RABBITMQ_URL não definida — consumer desabilitado");
      return;
    }

    const { serviceName, bindings } = this.options;
    const queueName = `${serviceName.replace(/-service$/, "")}_events`;

    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: Channel) => {
        await ch.assertExchange(DOMAIN_EVENTS_EXCHANGE, "topic", {
          durable: true,
        });
        const { queue } = await ch.assertQueue(queueName, { durable: true });
        for (const key of bindings) {
          await ch.bindQueue(queue, DOMAIN_EVENTS_EXCHANGE, key);
        }
        await ch.consume(queue, (msg: ConsumeMessage | null) =>
          this.handleMessage(msg),
        );
      },
    });

    this.logger.log(
      `Consumer ativo: fila "${queueName}" → [${bindings.join(", ")}]`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) return;

    const routingKey = msg.fields.routingKey;
    const raw = JSON.parse(msg.content.toString()) as unknown;
    const handlers = this.handlers.get(routingKey) ?? [];

    try {
      const data = unwrapEventPayload(raw, routingKey);
      for (const handler of handlers) {
        await handler(data);
      }
      this.channel.ack(msg);
    } catch (error) {
      if (error instanceof UnsupportedEventVersionError) {
        this.logger.warn(error.message);
        this.channel.nack(msg, false, false);
        return;
      }
      this.logger.error(`Erro ao processar ${routingKey}`, error);
      this.channel.nack(msg, false, false);
    }
  }
}
