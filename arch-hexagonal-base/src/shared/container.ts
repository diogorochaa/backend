import { CreateUserUsecase } from "../domain/usecases/create-user.usecase.js";
import { PrismaUserRepository } from "../infra/database/prisma-user.repository.js";
import { prisma } from "../infra/database/prisma.js";
import { UserController } from "../infra/http/user.controller.js";  


const userRepository = new PrismaUserRepository(prisma);
const createUserUsecase = new CreateUserUsecase(userRepository);
const userController = new UserController(createUserUsecase);

export { userController };