import "dotenv/config";
import { defineConfig } from "prisma/config";

// Fallback to a placeholder connection string if DATABASE_URL is not set (e.g. during build/ci)
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ledgerflow?sslmode=disable";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
