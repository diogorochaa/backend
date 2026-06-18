import { Injectable, Logger } from "@nestjs/common";
import {
  EventConsumer,
  RoutingKeys,
  type UserCreatedEvent,
  type UserDeletedEvent,
  type UserUpdatedEvent,
} from "@repo/messaging";

/**
 * Exemplo: orders-service reage a mudanças de usuário sem chamar users-service via HTTP.
 * Em produção, aqui você validaria userId em pedidos, invalidaria cache, etc.
 */
@Injectable()
export class UserEventsListener {
  private readonly logger = new Logger(UserEventsListener.name);

  constructor(private readonly consumer: EventConsumer) {
    this.consumer.subscribe<UserCreatedEvent>(
      RoutingKeys.USER_CREATED,
      (event) => {
        this.logger.log(
          `Usuário criado: ${event.name} <${event.email}> (${event.userId})`,
        );
      },
    );

    this.consumer.subscribe<UserUpdatedEvent>(
      RoutingKeys.USER_UPDATED,
      (event) => {
        this.logger.log(`Usuário atualizado: ${event.userId}`);
      },
    );

    this.consumer.subscribe<UserDeletedEvent>(
      RoutingKeys.USER_DELETED,
      (event) => {
        this.logger.log(`Usuário removido: ${event.userId}`);
      },
    );
  }
}
