import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port, "0.0.0.0");

  console.log(`orders-service (events-only) on http://localhost:${port}`);
  console.log("  health: GET /health — não registrado no gateway");
  console.log("  RabbitMQ: user.created | user.updated | user.deleted");
}

bootstrap();
