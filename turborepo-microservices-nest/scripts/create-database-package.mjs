#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATABASE_DIR = path.join(ROOT, "packages", "database");

const NAME_REGEX = /^[a-z][a-z0-9]*$/;

function toDomain(raw) {
  const name = raw
    .trim()
    .toLowerCase()
    .replace(/-service$/, "");
  if (!NAME_REGEX.test(name)) {
    throw new Error(
      `Nome inválido "${raw}". Use apenas [a-z] (ex: billing, orders).`,
    );
  }
  return name;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeDatabasePackage(domain) {
  const pkgName = `@repo/database-${domain}`;
  const dbName = `${domain}_db`;
  const envVar = `${domain.toUpperCase()}_DATABASE_URL`;
  const directEnvVar = `${domain.toUpperCase()}_DIRECT_URL`;
  const pkgDir = path.join(DATABASE_DIR, domain);

  if (fs.existsSync(pkgDir)) {
    throw new Error(`Já existe: packages/database/${domain}`);
  }

  fs.mkdirSync(path.join(pkgDir, "prisma", "migrations"), { recursive: true });
  fs.mkdirSync(path.join(pkgDir, "src"), { recursive: true });

  writeJson(path.join(pkgDir, "package.json"), {
    name: pkgName,
    version: "0.0.0",
    private: true,
    main: "./dist/src/index.js",
    types: "./dist/src/index.d.ts",
    exports: {
      ".": {
        types: "./dist/src/index.d.ts",
        default: "./dist/src/index.js",
      },
    },
    scripts: {
      generate: "prisma generate",
      build: "pnpm generate && tsc",
      "db:generate": "pnpm generate",
      "db:migrate": "prisma migrate dev",
      "db:push": "prisma db push",
      "db:studio": "prisma studio",
      "check-types": "pnpm generate && tsc --noEmit",
    },
    dependencies: {
      "@nestjs/common": "^11.0.1",
      "@nestjs/config": "^4.0.0",
      "@prisma/adapter-pg": "^7.0.0",
      "@prisma/client": "^7.0.0",
      pg: "^8.16.0",
    },
    devDependencies: {
      "@repo/typescript-config": "workspace:*",
      "@types/pg": "^8.15.0",
      dotenv: "^16.6.1",
      prisma: "^7.0.0",
      typescript: "5.9.2",
    },
  });

  writeJson(path.join(pkgDir, "tsconfig.json"), {
    extends: "../../typescript-config/nestjs-library.json",
    compilerOptions: { outDir: "./dist", rootDir: "." },
    include: ["src", "generated"],
    exclude: ["node_modules", "dist"],
  });

  fs.writeFileSync(
    path.join(pkgDir, "prisma.config.ts"),
    `import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.${directEnvVar} ??
      process.env.DIRECT_URL ??
      process.env.${envVar} ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public",
  },
});
`,
  );

  fs.writeFileSync(
    path.join(pkgDir, "prisma", "schema.prisma"),
    `generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// Adicione seus models aqui
model Placeholder {
  id        String   @id @default(uuid()) @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  @@map("_placeholder")
}
`,
  );

  fs.writeFileSync(
    path.join(pkgDir, ".env.example"),
    `${envVar}=postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public\n`,
  );

  fs.writeFileSync(
    path.join(pkgDir, "src", "index.ts"),
    `export { PrismaClient } from "../generated/prisma/client";
export { PrismaModule } from "./prisma.module";
export { PrismaService } from "./prisma.service";
`,
  );

  fs.writeFileSync(
    path.join(pkgDir, "src", "prisma.module.ts"),
    `import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`,
  );

  fs.writeFileSync(
    path.join(pkgDir, "src", "prisma.service.ts"),
    `import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger("PrismaService[${domain}]");
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString =
      config.get<string>("${envVar}") ??
      config.getOrThrow<string>("DATABASE_URL");
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Connected to ${dbName}");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log("Disconnected from ${dbName}");
  }
}
`,
  );

  return { domain, pkgName, dbName, envVar, pkgDir };
}

function appendDbToDockerInit(dbName) {
  const initFile = path.join(
    ROOT,
    "docker",
    "postgres",
    "init",
    "01-create-databases.sh",
  );
  const marker = `CREATE DATABASE ${dbName}`;
  const content = fs.readFileSync(initFile, "utf8");
  if (content.includes(marker)) return false;

  const insert = `\n\tSELECT 'CREATE DATABASE ${dbName}'\n\tWHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${dbName}')\\gexec`;
  const updated = content.replace("EOSQL", `${insert}\nEOSQL`);
  fs.writeFileSync(initFile, updated);
  return true;
}

function appendRootMigrateScript(domain) {
  const pkgPath = path.join(ROOT, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const pkgFilter = `@repo/database-${domain}`;

  rootPkg.scripts[`db:migrate:${domain}`] =
    `pnpm --filter ${pkgFilter} db:migrate`;

  for (const key of ["db:generate", "db:migrate", "db:push"]) {
    const cmd = rootPkg.scripts[key];
    if (cmd && !cmd.includes(pkgFilter)) {
      rootPkg.scripts[key] = `${cmd} --filter=${pkgFilter}`;
    }
  }

  writeJson(pkgPath, rootPkg);
}

export function createDatabasePackage(domainInput) {
  const domain = toDomain(domainInput);
  const result = writeDatabasePackage(domain);
  appendDbToDockerInit(result.dbName);
  appendRootMigrateScript(domain);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const domain = process.argv[2];
  if (!domain) {
    console.error("Uso: node scripts/create-database-package.mjs <dominio>");
    process.exit(1);
  }
  const { pkgName, dbName, envVar } = createDatabasePackage(domain);
  console.log(`✔ Pacote ${pkgName} criado (${dbName})`);
  console.log(`  Env: ${envVar}`);
  console.log(`  pnpm db:migrate:${domain}`);
}
