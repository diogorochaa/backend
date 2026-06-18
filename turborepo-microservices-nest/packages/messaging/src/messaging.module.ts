import { type DynamicModule, Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import {
  EventConsumer,
  MESSAGING_CONSUMER_OPTIONS,
  type MessagingConsumerOptions,
} from "./event-consumer.service";
import { EventPublisher } from "./event-publisher.service";

@Global()
@Module({})
export class MessagingModule {
  /** Publica eventos no exchange domain.events (users, orders, etc.) */
  static forPublisher(): DynamicModule {
    return {
      module: MessagingModule,
      imports: [ConfigModule],
      providers: [EventPublisher],
      exports: [EventPublisher],
    };
  }

  /** Consome eventos com fila dedicada por serviço */
  static forConsumer(options: MessagingConsumerOptions): DynamicModule {
    return {
      module: MessagingModule,
      imports: [ConfigModule],
      providers: [
        { provide: MESSAGING_CONSUMER_OPTIONS, useValue: options },
        EventConsumer,
      ],
      exports: [EventConsumer],
    };
  }
}
