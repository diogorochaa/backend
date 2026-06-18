/** Versão atual do contrato de eventos — incremente ao mudar o formato do envelope */
export const CURRENT_EVENT_VERSION = 1;

export interface DomainEventEnvelope<T = unknown> {
  /** Versão do envelope (consumers antigos ignoram versões maiores com log) */
  version: number;
  /** Routing key / tipo do evento (ex: user.created) */
  type: string;
  /** Payload do domínio */
  data: T;
  /** ISO-8601 — quando o fato ocorreu */
  occurredAt: string;
  metadata?: {
    correlationId?: string;
    source?: string;
  };
}

export function createEventEnvelope<T extends object>(
  type: string,
  data: T,
  metadata?: DomainEventEnvelope<T>["metadata"],
): DomainEventEnvelope<T> {
  return {
    version: CURRENT_EVENT_VERSION,
    type,
    data,
    occurredAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };
}

export function isDomainEventEnvelope(
  value: unknown,
): value is DomainEventEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === "number" &&
    typeof obj.type === "string" &&
    "data" in obj &&
    typeof obj.occurredAt === "string"
  );
}

/**
 * Aceita envelope versionado ou payload legado (pré-v2).
 * Handlers recebem sempre `data` desembrulhado.
 */
export function unwrapEventPayload<T>(raw: unknown, routingKey: string): T {
  if (isDomainEventEnvelope(raw)) {
    if (raw.version > CURRENT_EVENT_VERSION) {
      throw new UnsupportedEventVersionError(raw.version, routingKey);
    }
    if (raw.type !== routingKey) {
      throw new EventTypeMismatchError(raw.type, routingKey);
    }
    return raw.data as T;
  }
  return raw as T;
}

export class UnsupportedEventVersionError extends Error {
  constructor(version: number, routingKey: string) {
    super(
      `Evento "${routingKey}" com versão ${version} não suportada (máx: ${CURRENT_EVENT_VERSION})`,
    );
    this.name = "UnsupportedEventVersionError";
  }
}

export class EventTypeMismatchError extends Error {
  constructor(envelopeType: string, expected: string) {
    super(
      `Tipo do envelope "${envelopeType}" não corresponde à routing key "${expected}"`,
    );
    this.name = "EventTypeMismatchError";
  }
}
