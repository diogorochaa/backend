/** Exchange topic compartilhado entre todos os microserviços */
export const DOMAIN_EVENTS_EXCHANGE = "domain.events";

export const RoutingKeys = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  ORDER_CREATED: "order.created",
} as const;

export type RoutingKey = (typeof RoutingKeys)[keyof typeof RoutingKeys];
