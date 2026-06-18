import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { PrismaService } from "@repo/database-users";
import request from "supertest";
import { UsersController } from "../src/users/users.controller";
import { UsersService } from "../src/users/users.service";

describe("Users API (e2e)", () => {
  let app: INestApplication;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("POST /users creates user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      password: "hashed",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer())
      .post("/users")
      .send({
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe("test@example.com");
        expect(res.body).not.toHaveProperty("password");
      });
  });

  it("GET /users returns list", async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await request(app.getHttpServer()).get("/users").expect(200).expect([]);
  });
});
