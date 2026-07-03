// src/domain/errors/user-already-exists.error.ts

export class UserAlreadyExistsError extends Error {
    constructor(email: string) {
      super(`User '${email}' already exists`);
      this.name = "UserAlreadyExistsError";
    }
  }