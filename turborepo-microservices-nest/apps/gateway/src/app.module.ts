import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { ProxyModule } from "./proxy/proxy.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env", "../../docker/.env"],
    }),
    ProxyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
