import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MessagingModule } from "@repo/messaging";
import { UserEventsListener } from "./events/user-events.listener";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env", "../../docker/.env"],
    }),
    MessagingModule.forConsumer({
      serviceName: "orders-service",
      bindings: ["user.created", "user.updated", "user.deleted"],
    }),
  ],
  controllers: [HealthController],
  providers: [UserEventsListener],
})
export class AppModule {}
