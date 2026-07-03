import type { FastifyRequest, FastifyReply } from "fastify";
import type { CreateUserUsecase } from "../../domain/usecases/create-user.usecase.js";
import type { User } from "../../domain/entities/user.js";

export class UserController {
  constructor(private readonly createUserUsecase: CreateUserUsecase) {}

  async createUser(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const user = request.body as User;
    await this.createUserUsecase.execute(user);
    return reply.status(201).send({ message: "User created successfully", user: user });  
    }
}