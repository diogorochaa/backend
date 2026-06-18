import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@repo/database-users";
import {
  RoutingKeys,
  type UserCreatedEvent,
  type UserDeletedEvent,
  type UserUpdatedEvent,
} from "@repo/messaging";
import * as bcrypt from "bcrypt";
import { OutboxService } from "../outbox/outbox.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { UserResponseDto } from "./dto/user-response.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password,
          active: dto.active ?? true,
        },
      });

      await this.outbox.enqueueInTransaction<UserCreatedEvent>(
        tx,
        RoutingKeys.USER_CREATED,
        {
          userId: created.id,
          email: created.email,
          name: created.name,
          active: created.active,
          occurredAt: new Date().toISOString(),
        },
      );

      return created;
    });

    return this.toResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.ensureExists(id);

    if (dto.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });

      if (emailTaken) {
        throw new ConflictException("Email already registered");
      }
    }

    const data: {
      email?: string;
      name?: string;
      password?: string;
      active?: boolean;
    } = {};

    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data,
      });

      await this.outbox.enqueueInTransaction<UserUpdatedEvent>(
        tx,
        RoutingKeys.USER_UPDATED,
        {
          userId: updated.id,
          email: updated.email,
          name: updated.name,
          active: updated.active,
          occurredAt: new Date().toISOString(),
        },
      );

      return updated;
    });

    return this.toResponse(user);
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      await this.outbox.enqueueInTransaction<UserDeletedEvent>(
        tx,
        RoutingKeys.USER_DELETED,
        {
          userId: id,
          occurredAt: new Date().toISOString(),
        },
      );
    });
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  private toResponse(user: {
    id: string;
    email: string;
    name: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
