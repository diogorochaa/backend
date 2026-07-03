// src/infra/database/prisma-user.repository.ts

import { PrismaClient } from "../../../generated/prisma/client.js";
import type { User } from "../../domain/entities/user.js";
import type { UserRepository } from "../../domain/ports/user.repository.js";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });
  } 

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }
} 