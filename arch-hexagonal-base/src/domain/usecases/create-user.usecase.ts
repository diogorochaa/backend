// src/domain/usecases/create-user.usecase.ts

import type { User } from "../entities/user.js";
import type { UserRepository } from "../ports/user.repository.js";
import { UserAlreadyExistsError } from "../errors/user-already-exists.error.js";

export class CreateUserUsecase {
  constructor(
    private readonly repository: UserRepository,
  ) {}

  async execute(user: User): Promise<void> {
    const exists = await this.repository.findByEmail(user.email);

    if (exists) {
      throw new UserAlreadyExistsError(user.email);
    }

    await this.repository.create(user);
  }
}