import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.GATEWAY_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");

  console.log(`gateway HTTP on http://localhost:${port}/api`);
  console.log(
    `  users  → ${process.env.USERS_SERVICE_URL ?? "http://localhost:3000"}`,
  );
  console.log("  (events-only MS não passam pelo gateway)");
}

bootstrap();
