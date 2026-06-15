import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 15_000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function num(v) {
  return Number(v.toString());
}

async function main() {
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

  let expenseWrongBase = 0;
  let expenseRateOneCrossCurrency = 0;
  let expenseCrossCurrency = 0;
  const expenseSamples = [];

  for (const e of expenses) {
    const orig = num(e.originalAmount);
    const base = num(e.baseAmount);
    const rate = num(e.exchangeRate);
    const groupCur = e.group.currency;
    const origCur = e.originalCurrency;

    if (origCur !== groupCur) {
      expenseCrossCurrency++;
      if (rate === 1) expenseRateOneCrossCurrency++;
      if (rate === 1 && Math.abs(orig - base) < 0.001) {
        expenseWrongBase++;
        if (expenseSamples.length < 5) {
          expenseSamples.push({
            id: e.id,
            originalAmount: orig,
            baseAmount: base,
            exchangeRate: rate,
            originalCurrency: origCur,
            groupCurrency: groupCur,
          });
        }
      }
    }
  }

  let settlementWrongBase = 0;
  let settlementRateOneCrossCurrency = 0;
  const settlementSamples = [];

  for (const s of settlements) {
    const orig = num(s.originalAmount);
    const base = num(s.baseAmount);
    const rate = num(s.exchangeRate);
    const groupCur = s.group.currency;
    const origCur = s.originalCurrency;

    if (origCur !== groupCur) {
      if (rate === 1) settlementRateOneCrossCurrency++;
      if (rate === 1 && Math.abs(orig - base) < 0.001) {
        settlementWrongBase++;
        if (settlementSamples.length < 5) {
          settlementSamples.push({
            id: s.id,
            originalAmount: orig,
            baseAmount: base,
            exchangeRate: rate,
            originalCurrency: origCur,
            groupCurrency: groupCur,
          });
        }
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        totalExpenses: expenses.length,
        totalSettlements: settlements.length,
        expenseCrossCurrency,
        expenseRateOneCrossCurrency,
        expenseWrongBase,
        expenseSamples,
        settlementWrongBase,
        settlementRateOneCrossCurrency,
        settlementSamples,
        currenciesInExpenses: [...new Set(expenses.map((e) => e.originalCurrency))],
        groupCurrencies: [...new Set(expenses.map((e) => e.group.currency))],
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error("DB_ERROR:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
