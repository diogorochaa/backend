import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: resolve(__dirname, ".env") });

/**
 * Supabase: use DIRECT_URL (porta 5432) no CLI (migrate, db push).
 * Runtime (apps): ORDERS_DATABASE_URL com pooler (porta 6543 + ?pgbouncer=true).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.ORDERS_DIRECT_URL ??
      process.env.DIRECT_URL ??
      process.env.ORDERS_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/orders_db?schema=public",
  },
});
