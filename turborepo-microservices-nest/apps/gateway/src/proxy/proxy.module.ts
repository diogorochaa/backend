import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ProxyService } from "./proxy.service";
import { UsersProxyController } from "./users-proxy.controller";

/**
 * Só microserviços com API pública entram aqui.
 * Workers (events-only) como orders-service NÃO têm proxy.
 * @see ./public-routes.ts
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 0,
    }),
  ],
  controllers: [UsersProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
