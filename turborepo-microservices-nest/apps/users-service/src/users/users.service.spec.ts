import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { PrismaService } from "@repo/database-users";
import { OutboxService } from "../outbox/outbox.service";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      fn({
        user: {
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        outboxEvent: { create: jest.fn() },
      }),
    ),
  };

  const outbox = {
    enqueueInTransaction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: OutboxService, useValue: outbox },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it("creates a user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const txUser = {
      create: jest.fn().mockResolvedValue({
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "a@b.com",
        name: "Alice",
        password: "hashed",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    prisma.$transaction.mockImplementation(async (fn) =>
      fn({
        user: txUser,
        outboxEvent: { create: jest.fn() },
      }),
    );

    const result = await service.create({
      email: "a@b.com",
      name: "Alice",
      password: "password123",
    });

    expect(result.email).toBe("a@b.com");
    expect(result).not.toHaveProperty("password");
  });

  it("throws when email exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1" });

    await expect(
      service.create({
        email: "a@b.com",
        name: "Alice",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("throws when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.findOne("550e8400-e29b-41d4-a716-446655440000"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
