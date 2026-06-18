import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "@repo/database-users";
import { MessagingModule } from "@repo/messaging";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env", "../../docker/.env"],
    }),
    PrismaModule,
    MessagingModule.forPublisher(),
    UsersModule,
  ],
})
export class AppModule {}
