/**
 * One-time backfill for Expense/Settlement rows stored before currency normalization.
 * DO NOT run without explicit approval. Dry-run by default.
 *
 * Usage:
 *   node scripts/backfill-currency-records.mjs          # dry run
 *   node scripts/backfill-currency-records.mjs --apply  # apply updates
 */

import { config } from "dotenv";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const TO_INR = { INR: 1, USD: 85, EUR: 92, GBP: 107 };

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function getExchangeRate(from, to) {
  const fromRate = TO_INR[from] ?? null;
  const toRate = TO_INR[to] ?? null;
  if (!fromRate || !toRate) return null;
  if (from === to) return 1;
  return Math.round((fromRate / toRate) * 1_000_000) / 1_000_000;
}

function normalize(originalAmount, originalCurrency, groupCurrency) {
  const rate = getExchangeRate(originalCurrency, groupCurrency);
  if (rate === null) return null;
  return {
    exchangeRate: rate,
    baseAmount: roundMoney(originalAmount * rate),
  };
}

const apply = process.argv.includes("--apply");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("NO_DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 15000 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const expenses = await prisma.expense.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      originalAmount: true,
      originalCurrency: true,
      exchangeRate: true,
      baseAmount: true,
      group: { select: { currency: true } },
    },
  });

  const settlements = await prisma.settlement.findMany({
    select: {
      id: true,
      originalAmount: true,
      originalCurrency: true,
      exchangeRate: true,
      baseAmount: true,
      group: { select: { currency: true } },
    },
  });

  const expenseUpdates = [];
  for (const row of expenses) {
    const orig = Number(row.originalAmount);
    const base = Number(row.baseAmount);
    const rate = Number(row.exchangeRate);
    const groupCur = row.group.currency;
    const origCur = row.originalCurrency;

    const needsFix =
      origCur !== groupCur && rate === 1 && orig === base;

    if (!needsFix) continue;

    const normalized = normalize(orig, origCur, groupCur);
    if (!normalized) continue;

    expenseUpdates.push({
      id: row.id,
      ...normalized,
    });
  }

  const settlementUpdates = [];
  for (const row of settlements) {
    const orig = Number(row.originalAmount);
    const base = Number(row.baseAmount);
    const rate = Number(row.exchangeRate);
    const groupCur = row.group.currency;
    const origCur = row.originalCurrency;

    const needsFix =
      origCur !== groupCur && rate === 1 && orig === base;

    if (!needsFix) continue;

    const normalized = normalize(orig, origCur, groupCur);
    if (!normalized) continue;

    settlementUpdates.push({
      id: row.id,
      ...normalized,
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        expenseUpdates,
        settlementUpdates,
      },
      null,
      2
    )
  );

  if (apply && (expenseUpdates.length > 0 || settlementUpdates.length > 0)) {
    await prisma.$transaction(async (tx) => {
      for (const update of expenseUpdates) {
        await tx.expense.update({
          where: { id: update.id },
          data: {
            exchangeRate: new Prisma.Decimal(update.exchangeRate.toFixed(6)),
            baseAmount: new Prisma.Decimal(update.baseAmount.toFixed(2)),
          },
        });
      }
      for (const update of settlementUpdates) {
        await tx.settlement.update({
          where: { id: update.id },
          data: {
            exchangeRate: new Prisma.Decimal(update.exchangeRate.toFixed(6)),
            baseAmount: new Prisma.Decimal(update.baseAmount.toFixed(2)),
          },
        });
      }
    });
    console.log("BACKFILL_APPLIED");
  }
} catch (error) {
  console.error("BACKFILL_ERROR:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
