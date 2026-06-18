export type { RoutingKey } from "./constants";
export { DOMAIN_EVENTS_EXCHANGE, RoutingKeys } from "./constants";
export type {
  EventHandler,
  MessagingConsumerOptions,
} from "./event-consumer.service";
export {
  EventConsumer,
  MESSAGING_CONSUMER_OPTIONS,
} from "./event-consumer.service";
export type { DomainEventEnvelope } from "./event-envelope";
export {
  CURRENT_EVENT_VERSION,
  createEventEnvelope,
  EventTypeMismatchError,
  isDomainEventEnvelope,
  UnsupportedEventVersionError,
  unwrapEventPayload,
} from "./event-envelope";
export { EventPublisher } from "./event-publisher.service";
export type {
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from "./events/user.events";
export { MessagingModule } from "./messaging.module";
