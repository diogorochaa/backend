import type { FastifyInstance } from "fastify";
import { userController } from "../../shared/container.js";

export async function userRoutes(app: FastifyInstance) {
  app.post("/users", (request, reply) =>
    userController.createUser(request, reply),
  );
}