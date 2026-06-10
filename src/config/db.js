const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

// Build datasource URL — append connection pool params for Neon serverless
// ?connect_timeout=10&pool_timeout=10&pgbouncer=true keeps connections alive
// through Neon's auto-suspend and pooler restarts
function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url) return url;
  try {
    const parsed = new URL(url);
    // These params prevent the "connection closed" error on Neon free tier
    if (!parsed.searchParams.has("connect_timeout"))
      parsed.searchParams.set("connect_timeout", "10");
    if (!parsed.searchParams.has("pool_timeout"))
      parsed.searchParams.set("pool_timeout", "10");
    if (!parsed.searchParams.has("sslmode"))
      parsed.searchParams.set("sslmode", "require");
    return parsed.toString();
  } catch {
    return url;
  }
}

const prisma = new PrismaClient({
  datasourceUrl: buildDatabaseUrl(),
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Graceful shutdown — prevent lingering connections
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
