import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "@repo/database-users";
import { EventPublisher, isDomainEventEnvelope } from "@repo/messaging";

const POLL_MS = 2_000;
const BATCH_SIZE = 20;

@Injectable()
export class OutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessor.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: EventPublisher,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.flushPending();
    }, POLL_MS);
    this.logger.log(`Outbox processor ativo (a cada ${POLL_MS}ms)`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async flushPending(): Promise<void> {
    const pending = await this.prisma.outboxEvent.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    for (const row of pending) {
      try {
        const payload = row.payload;
        const data = isDomainEventEnvelope(payload) ? payload.data : payload;

        await this.publisher.publish(row.routingKey, data as object);

        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Falha ao publicar outbox ${row.id}`, error);
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: {
            status: "FAILED",
            attempts: { increment: 1 },
          },
        });
      }
    }
  }
}
