import Fastify from "fastify";

import { userRoutes } from "./infra/routes/user.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(userRoutes);

  return app;
}