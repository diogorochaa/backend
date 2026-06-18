import { Injectable } from "@nestjs/common";
import type { Prisma } from "@repo/database-users";
import { createEventEnvelope } from "@repo/messaging";

@Injectable()
export class OutboxService {
  /** Grava evento na mesma transação do domínio (outbox pattern). */
  async enqueueInTransaction<T extends object>(
    tx: Prisma.TransactionClient,
    routingKey: string,
    data: T,
  ): Promise<void> {
    const envelope = createEventEnvelope(routingKey, data, {
      source: "users-service",
    });

    await tx.outboxEvent.create({
      data: {
        routingKey,
        payload: envelope as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
