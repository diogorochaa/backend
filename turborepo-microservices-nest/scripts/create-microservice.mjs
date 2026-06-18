#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabasePackage } from "./create-database-package.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APPS_DIR = path.join(ROOT, "apps");

const NAME_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function usage() {
  console.log(`
Uso: pnpm create:service <nome> [opções]

Perfis:
  (padrão) --http          API REST + publica eventos (registrar no gateway)
  --consumer-only         Só RabbitMQ + /health interno (sem gateway)
  --with-db               Pacote Prisma em packages/database/<dominio>

Opções:
  --port, -p <porta>      Porta HTTP interna (padrão: 3000)
  --bindings <keys>       Routing keys do consumer (vírgula). Ex: user.created,order.*
  --help, -h

Exemplos:
  pnpm create:service billing --port 3003 --with-db
  pnpm create:service notification --consumer-only --bindings user.created,order.created
`);
}

function parseArgs(argv) {
  const args = {
    name: null,
    port: null,
    withDb: false,
    consumerOnly: false,
    bindings: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--with-db") args.withDb = true;
    else if (arg === "--consumer-only") args.consumerOnly = true;
    else if (arg === "--consumer") args.consumerOnly = true;
    else if (arg === "--http") args.consumerOnly = false;
    else if (arg === "--bindings") args.bindings = argv[++i];
    else if (arg === "--port" || arg === "-p") args.port = Number(argv[++i]);
    else if (!arg.startsWith("-") && !args.name) args.name = arg;
  }

  return args;
}

function normalizeServiceName(raw) {
  const name = raw.trim().toLowerCase();
  if (!NAME_REGEX.test(name)) {
    throw new Error(
      `Nome inválido "${raw}". Use kebab-case (ex: users, billing-service).`,
    );
  }
  return name.endsWith("-service") ? name : `${name}-service`;
}

function toDomain(serviceName) {
  return serviceName.replace(/-service$/, "");
}

function isDirectoryEmpty(dir) {
  if (!fs.existsSync(dir)) return true;
  return fs.readdirSync(dir).length === 0;
}

function run(command, options = {}) {
  execSync(command, {
    cwd: ROOT,
    stdio: "inherit",
    ...options,
  });
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function patchPackageJson(serviceDir, serviceName, options) {
  const { withDb, domain } = options;
  const pkgPath = path.join(serviceDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  pkg.name = serviceName;
  pkg.description = `${serviceName} microservice`;

  pkg.scripts = {
    build: "nest build",
    dev: "nest start --watch",
    start: "nest start",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    lint: `pnpm -w exec biome check --error-on-warnings apps/${serviceName}`,
    "check-types": "tsc --noEmit -p tsconfig.json",
    test: "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
  };

  for (const dep of [
    "@eslint/eslintrc",
    "@eslint/js",
    "eslint",
    "eslint-config-prettier",
    "eslint-plugin-prettier",
    "globals",
    "prettier",
    "typescript-eslint",
    "@biomejs/biome",
  ]) {
    delete pkg.devDependencies?.[dep];
  }

  pkg.devDependencies = {
    ...pkg.devDependencies,
    "@repo/typescript-config": "workspace:*",
  };

  pkg.dependencies = {
    ...pkg.dependencies,
    "@nestjs/config": "^4.0.0",
    "@repo/messaging": "workspace:*",
  };

  if (!options.consumerOnly) {
    pkg.dependencies["class-transformer"] = "^0.5.1";
    pkg.dependencies["class-validator"] = "^0.14.1";
  }

  delete pkg.dependencies?.["@nestjs/microservices"];

  if (withDb) {
    pkg.dependencies[`@repo/database-${domain}`] = "workspace:*";
  }

  writeJson(pkgPath, pkg);
}

function writeTsConfigs(serviceDir) {
  writeJson(path.join(serviceDir, "tsconfig.json"), {
    extends: "../../packages/typescript-config/nestjs.json",
    compilerOptions: {
      outDir: "./dist",
      rootDir: "./src",
      baseUrl: "./",
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "test"],
  });

  writeJson(path.join(serviceDir, "tsconfig.build.json"), {
    extends: "./tsconfig.json",
    compilerOptions: { incremental: false },
    exclude: ["node_modules", "dist", "test", "**/*spec.ts"],
  });
}

function writeHttpMainTs(serviceDir, port, serviceName, domain) {
  fs.writeFileSync(
    path.join(serviceDir, "src", "main.ts"),
    `import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? ${port});
  await app.listen(port, "0.0.0.0");

  console.log(\`${serviceName} HTTP on http://localhost:\${port}\`);
  console.log(\`  gateway: http://localhost:4000/api/${domain} (após registrar proxy)\`);
}

bootstrap();
`,
  );
}

function writeConsumerMainTs(serviceDir, port, serviceName) {
  fs.writeFileSync(
    path.join(serviceDir, "src", "main.ts"),
    `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT ?? ${port});
  await app.listen(port, "0.0.0.0");

  console.log(\`${serviceName} (events-only) on http://localhost:\${port}\`);
  console.log("  health: GET /health — não exposto no gateway");
}

bootstrap();
`,
  );
}

function writeHttpAppModule(serviceDir, _serviceName, { withDb, domain }) {
  const dbImport = withDb
    ? `import { PrismaModule } from "@repo/database-${domain}";`
    : "";
  const dbModule = withDb ? "    PrismaModule," : "";

  fs.writeFileSync(
    path.join(serviceDir, "src", "app.module.ts"),
    `import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MessagingModule } from "@repo/messaging";
${dbImport}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env", "../../docker/.env"],
    }),
    MessagingModule.forPublisher(),
${dbModule}
  ],
})
export class AppModule {}
`,
  );
}

function writeConsumerAppModule(
  serviceDir,
  serviceName,
  { withDb, domain, bindings },
) {
  const dbImport = withDb
    ? `import { PrismaModule } from "@repo/database-${domain}";`
    : "";
  const dbModule = withDb ? "    PrismaModule," : "";
  const bindingsJson = JSON.stringify(bindings);

  fs.writeFileSync(
    path.join(serviceDir, "src", "app.module.ts"),
    `import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MessagingModule } from "@repo/messaging";
import { DomainEventsListener } from "./events/domain-events.listener";
import { HealthController } from "./health/health.controller";
${dbImport}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env", "../../docker/.env"],
    }),
    MessagingModule.forConsumer({
      serviceName: "${serviceName}",
      bindings: ${bindingsJson},
    }),
${dbModule}
  ],
  controllers: [HealthController],
  providers: [DomainEventsListener],
})
export class AppModule {}
`,
  );
}

function writeHealthController(serviceDir, serviceName) {
  const dir = path.join(serviceDir, "src", "health");
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(
    path.join(dir, "health.controller.ts"),
    `import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      service: "${serviceName}",
      exposure: "events-only",
      status: "ok",
    };
  }
}
`,
  );

  fs.writeFileSync(
    path.join(dir, "health.controller.spec.ts"),
    `import { Test, type TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok", () => {
    const controller = new HealthController();
    expect(controller.check().status).toBe("ok");
  });
});
`,
  );
}

function writeDomainEventsListener(serviceDir, bindings) {
  const dir = path.join(serviceDir, "src", "events");
  fs.mkdirSync(dir, { recursive: true });

  const subscribeBlocks = bindings
    .map(
      (key) => `    this.consumer.subscribe("${key}", (payload) => {
      this.logger.log(\`Evento ${key}: \${JSON.stringify(payload)}\`);
    });`,
    )
    .join("\n\n");

  fs.writeFileSync(
    path.join(dir, "domain-events.listener.ts"),
    `import { Injectable, Logger } from "@nestjs/common";
import { EventConsumer } from "@repo/messaging";

@Injectable()
export class DomainEventsListener {
  private readonly logger = new Logger(DomainEventsListener.name);

  constructor(private readonly consumer: EventConsumer) {
${subscribeBlocks}
  }
}
`,
  );
}

function writeEnvExample(serviceDir, { port, withDb, domain }) {
  const envVar = `${domain.toUpperCase()}_DATABASE_URL`;
  const dbLine = withDb
    ? `${envVar}=postgresql://postgres:postgres@localhost:5432/${domain}_db?schema=public\n`
    : "";

  fs.writeFileSync(
    path.join(serviceDir, ".env.example"),
    `PORT=${port}
${dbLine}RABBITMQ_URL=amqp://guest:guest@localhost:5672
`,
  );
}

function writeRequestsHttp(serviceDir, port, domain, consumerOnly) {
  if (consumerOnly) {
    fs.writeFileSync(
      path.join(serviceDir, "requests.http"),
      `# ${domain}-service é events-only — sem rotas públicas
# Health interno (não passa pelo gateway):
GET http://localhost:${port}/health
`,
    );
    return;
  }

  fs.writeFileSync(
    path.join(serviceDir, "requests.http"),
    `@baseUrl = http://localhost:${port}
@gatewayUrl = http://localhost:4000/api

### Via API Gateway (após registrar proxy em apps/gateway)
# GET {{gatewayUrl}}/${domain}
`,
  );
}

function cleanupNestDefaults(serviceDir) {
  for (const file of [
    "eslint.config.mjs",
    "eslint.config.js",
    ".eslintrc.js",
    ".prettierrc",
    ".prettierrc.json",
    path.join("src", "app.controller.ts"),
    path.join("src", "app.service.ts"),
    path.join("src", "app.controller.spec.ts"),
  ]) {
    const fullPath = path.join(serviceDir, file);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.name) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const serviceName = normalizeServiceName(args.name);
  const domain = toDomain(serviceName);
  const serviceDir = path.join(APPS_DIR, serviceName);
  const port = args.port ?? 3000;
  const bindings = args.bindings
    ? args.bindings.split(",").map((b) => b.trim())
    : ["user.created", "user.updated", "user.deleted"];

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    console.error("Porta inválida.");
    process.exit(1);
  }

  if (fs.existsSync(serviceDir) && !isDirectoryEmpty(serviceDir)) {
    console.error(`Já existe: apps/${serviceName}`);
    process.exit(1);
  }

  fs.mkdirSync(APPS_DIR, { recursive: true });

  if (args.withDb) {
    console.log(`\n▶ Criando pacote Prisma @repo/database-${domain}...\n`);
    createDatabasePackage(domain);
  }

  const profile = args.consumerOnly ? "events-only" : "http";
  console.log(
    `\n▶ Criando ${serviceName} (perfil: ${profile}, porta ${port})...\n`,
  );

  run(
    `pnpm exec nest new ${serviceName} --directory apps/${serviceName} --package-manager pnpm --skip-git --strict`,
  );

  writeTsConfigs(serviceDir);

  if (args.consumerOnly) {
    writeConsumerMainTs(serviceDir, port, serviceName);
    writeConsumerAppModule(serviceDir, serviceName, {
      withDb: args.withDb,
      domain,
      bindings,
    });
    writeHealthController(serviceDir, serviceName);
    writeDomainEventsListener(serviceDir, bindings);
  } else {
    writeHttpMainTs(serviceDir, port, serviceName, domain);
    writeHttpAppModule(serviceDir, serviceName, {
      withDb: args.withDb,
      domain,
    });
  }

  writeEnvExample(serviceDir, {
    port,
    withDb: args.withDb,
    domain,
  });
  writeRequestsHttp(serviceDir, port, domain, args.consumerOnly);
  patchPackageJson(serviceDir, serviceName, {
    withDb: args.withDb,
    domain,
    consumerOnly: args.consumerOnly,
  });
  cleanupNestDefaults(serviceDir);

  console.log("\n▶ Instalando dependências...\n");
  run("pnpm install --no-frozen-lockfile", {
    env: { ...process.env, npm_config_confirmModulesPurge: "false" },
  });

  const dbSteps = args.withDb
    ? `\n  pnpm db:migrate:${domain}\n  pnpm --filter @repo/database-${domain} build`
    : "";

  const gatewayHint = args.consumerOnly
    ? "\n  (não registrar no gateway — só eventos)"
    : `\n  Registrar proxy em apps/gateway se API pública\n  Gateway: http://localhost:4000/api/${domain}`;

  console.log(`
✔ Microservice criado: apps/${serviceName}

  cp apps/${serviceName}/.env.example apps/${serviceName}/.env
  pnpm docker:up:all${dbSteps}
  pnpm --filter ${serviceName} dev
${gatewayHint}
`);
}

main();
