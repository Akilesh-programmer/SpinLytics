/**
 * SpinLytics — Database Seed Script (2026 Standard — Demo Data)
 *
 * Creates realistic 3-month demo data for all modules:
 *   - March, April, May 2026 production (6 rows/day, 41s + 47s counts)
 *   - Stock transactions (purchases, issues, waste, returns)
 *   - Packing entries
 *   - Dispatch entries (with linked stock transactions)
 *   - 5 months of EB entries (Jan–May 2026)
 *
 * Usage: node prisma/seed.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────
function date(d) {
  return new Date(d + "T00:00:00.000Z");
}
function rand(min, max, decimals = 3) {
  return +(min + Math.random() * (max - min)).toFixed(decimals);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generates all dates in a month (skipping Sundays — mill off)
function datesInMonth(year, month) {
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getDay() !== 0) {
      // 0 = Sunday
      days.push(
        `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      );
    }
  }
  return days;
}

// ─── Demo Constants ─────────────────────────────────────
const SIDERS = [
  "Kumar S",
  "Raju M",
  "Mohan K",
  "Ganesh R",
  "Vijay P",
  "Suresh T",
  "Arun D",
  "Karthik V",
  "Selvam B",
  "Muthu R",
];
const COUNTS = [
  { count: "41s", stdConstant: 0.00234, stdHK: 680.0 },
  { count: "47s", stdConstant: 0.00192, stdHK: 720.0 },
];
const RF_NAMES = ["RF-1", "RF-2", "RF-3", "RF-4", "RF-5", "RF-6"];

// Stock lots — raw material
const COTTON_LOT_MAR = "LOT-2026-C01";
const COTTON_LOT_APR = "LOT-2026-C02";
const COTTON_LOT_MAY = "LOT-2026-C03";
const FIBER_LOT = "LOT-2026-F01";
const VISCOSE_LOT_1 = "LOT-2026-V01";
const VISCOSE_LOT_2 = "LOT-2026-V02";
const EXCEL_LOT = "LOT-2026-E01";
const YARN_LOT_1 = "LOT-2026-Y01";
const YARN_LOT_2 = "LOT-2026-Y02";
const YARN_LOT_3 = "LOT-2026-Y03";

// Parties
const SUPPLIERS = {
  COTTON: "Prem Cotton Traders",
  FIBER: "Fibre King Pvt Ltd",
  VISCOSE: "Indo Viscose Ltd",
  EXCEL: "Excel Fibre Co.",
};
const BUYERS = [
  "Vinayaga Mills",
  "Sri Lakshmi Textiles",
  "KPR Mill Ltd",
  "Ramco Yarns",
  "Coats India Ltd",
];
const STOPPAGES = [
  "Power cut 30min",
  "Bobbin jam",
  "Yarn break – 20min",
  "Machine maintenance",
  "Power fluctuation",
  null,
  null,
  null,
];

async function main() {
  console.log("🧹 Clearing existing data...");
  await prisma.shiftProductionEntry.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.packingEntry.deleteMany();
  await prisma.dispatchEntry.deleteMany();
  await prisma.eBEntry.deleteMany();
  console.log("✅ Database cleared.\n");

  // ═══════════════════════════════════════════════════════════════
  // 1. SHIFT PRODUCTION ENTRIES — March, April, May 2026
  //    6 rows/day × (26 days March + 26 days April + 10 days May)
  // ═══════════════════════════════════════════════════════════════
  console.log("📝 Seeding shift production entries...");

  const marDates = datesInMonth(2026, 3);
  const aprDates = datesInMonth(2026, 4);
  // Only May 1–10 (today is May 10, 2026)
  const mayDates = datesInMonth(2026, 5).filter(
    (d) => parseInt(d.split("-")[2]) <= 10,
  );

  const allProdDates = [...marDates, ...aprDates, ...mayDates];

  const prodEntries = [];
  for (const d of allProdDates) {
    // Slight month-level efficiency trend: March good, April great, May very good
    const month = parseInt(d.split("-")[1]);
    const effMult = month === 3 ? 0.93 : month === 4 ? 0.97 : 0.95;

    for (let rfIdx = 0; rfIdx < 6; rfIdx++) {
      const countInfo = rfIdx < 3 ? COUNTS[0] : COUNTS[1];
      const actualHK = rand(
        countInfo.stdHK * (effMult - 0.05),
        countInfo.stdHK * (effMult + 0.04),
        1,
      );
      const runHrs = rand(10.5, 12.0, 1);
      const idle = Math.random() > 0.75 ? Math.floor(rand(10, 60, 0)) : 0;
      const wasteKgs = rand(0.015, 0.1, 3);
      const stoppage = Math.random() > 0.85 ? pick(STOPPAGES) : null;

      // Compute gross for autocorner calculation
      const grossKgs = actualHK * countInfo.stdConstant;
      // Autocorner = gross minus spinning loss (2-5% of gross)
      const spinLossFraction = rand(0.02, 0.05, 4);
      const autocornerKg = +(grossKgs * (1 - spinLossFraction)).toFixed(3);

      prodEntries.push({
        date: date(d),
        shiftHours: 12.0,
        totalSpindlesPerMachine: 1728,
        rfNo: RF_NAMES[rfIdx],
        siderName: SIDERS[(rfIdx + allProdDates.indexOf(d)) % SIDERS.length],
        count: countInfo.count,
        stdConstant: countInfo.stdConstant,
        stdHK: countInfo.stdHK,
        actualHK,
        runHrs,
        idleSpindles: idle,
        wasteKgs,
        autocornerKg,
        stoppages: stoppage,
      });
    }
  }

  // Insert in batches of 100 to avoid query size limits
  for (let i = 0; i < prodEntries.length; i += 100) {
    await prisma.shiftProductionEntry.createMany({
      data: prodEntries.slice(i, i + 100),
    });
  }
  console.log(
    `  → ${prodEntries.length} shift production entries (${allProdDates.length} days × 6 rows)`,
  );

  // ═══════════════════════════════════════════════════════════════
  // 2. STOCK TRANSACTIONS — Purchases & Issues covering all 3 months
  // ═══════════════════════════════════════════════════════════════
  console.log("📦 Seeding stock transactions...");

  const stockTxns = [
    // ─── MARCH PURCHASES ───────────────────────────────────────
    {
      date: date("2026-02-28"),
      materialType: "COTTON",
      transactionType: "PURCHASE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 80,
      kgs: 4800,
      pricePerBag: 5200,
      totalPrice: 416000,
      remarks: "March cotton opening stock",
    },
    {
      date: date("2026-03-01"),
      materialType: "FIBER",
      transactionType: "PURCHASE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 30,
      kgs: 1800,
      pricePerBag: 4800,
      totalPrice: 144000,
      remarks: "Fiber stock for Q1",
    },
    {
      date: date("2026-03-01"),
      materialType: "VISCOSE",
      transactionType: "PURCHASE",
      lotNo: VISCOSE_LOT_1,
      partyName: SUPPLIERS.VISCOSE,
      bags: 25,
      kgs: 1500,
      pricePerBag: 5500,
      totalPrice: 137500,
      remarks: null,
    },
    {
      date: date("2026-03-05"),
      materialType: "EXCEL",
      transactionType: "PURCHASE",
      lotNo: EXCEL_LOT,
      partyName: SUPPLIERS.EXCEL,
      bags: 15,
      kgs: 900,
      pricePerBag: 6200,
      totalPrice: 93000,
      remarks: "Excel fiber Q1",
    },

    // ─── MARCH ISSUES ────────────────────────────────────────
    {
      date: date("2026-03-01"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 9,
      kgs: 540,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Issue to production",
    },
    {
      date: date("2026-03-05"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 8,
      kgs: 480,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-10"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 9,
      kgs: 540,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-10"),
      materialType: "FIBER",
      transactionType: "ISSUE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 6,
      kgs: 360,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-15"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 10,
      kgs: 600,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-15"),
      materialType: "VISCOSE",
      transactionType: "ISSUE",
      lotNo: VISCOSE_LOT_1,
      partyName: SUPPLIERS.VISCOSE,
      bags: 5,
      kgs: 300,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-20"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 9,
      kgs: 540,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-20"),
      materialType: "EXCEL",
      transactionType: "ISSUE",
      lotNo: EXCEL_LOT,
      partyName: SUPPLIERS.EXCEL,
      bags: 4,
      kgs: 240,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-25"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 8,
      kgs: 480,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-28"),
      materialType: "FIBER",
      transactionType: "ISSUE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 5,
      kgs: 300,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-03-31"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAR,
      partyName: SUPPLIERS.COTTON,
      bags: 7,
      kgs: 420,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Month end issue",
    },

    // ─── MARCH WASTE ─────────────────────────────────────────
    {
      date: date("2026-03-15"),
      materialType: "WASTE",
      transactionType: "PURCHASE",
      lotNo: "WASTE-MAR-1",
      partyName: "Production Floor",
      bags: 3,
      kgs: 180,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Mid-month waste collection",
    },
    {
      date: date("2026-03-31"),
      materialType: "WASTE",
      transactionType: "PURCHASE",
      lotNo: "WASTE-MAR-2",
      partyName: "Production Floor",
      bags: 2.5,
      kgs: 150,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Month-end waste collection",
    },

    // ─── APRIL PURCHASES ─────────────────────────────────────
    {
      date: date("2026-03-29"),
      materialType: "COTTON",
      transactionType: "PURCHASE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 90,
      kgs: 5400,
      pricePerBag: 5350,
      totalPrice: 481500,
      remarks: "April cotton purchase",
    },
    {
      date: date("2026-04-02"),
      materialType: "VISCOSE",
      transactionType: "PURCHASE",
      lotNo: VISCOSE_LOT_2,
      partyName: SUPPLIERS.VISCOSE,
      bags: 20,
      kgs: 1200,
      pricePerBag: 5600,
      totalPrice: 112000,
      remarks: null,
    },
    {
      date: date("2026-04-05"),
      materialType: "FIBER",
      transactionType: "PURCHASE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 25,
      kgs: 1500,
      pricePerBag: 4900,
      totalPrice: 122500,
      remarks: "Fiber replenishment April",
    },
    {
      date: date("2026-04-10"),
      materialType: "EXCEL",
      transactionType: "PURCHASE",
      lotNo: EXCEL_LOT,
      partyName: SUPPLIERS.EXCEL,
      bags: 12,
      kgs: 720,
      pricePerBag: 6300,
      totalPrice: 75600,
      remarks: null,
    },

    // ─── APRIL ISSUES ────────────────────────────────────────
    {
      date: date("2026-04-01"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 10,
      kgs: 600,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-05"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 9,
      kgs: 540,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-05"),
      materialType: "VISCOSE",
      transactionType: "ISSUE",
      lotNo: VISCOSE_LOT_2,
      partyName: SUPPLIERS.VISCOSE,
      bags: 4,
      kgs: 240,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-10"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 11,
      kgs: 660,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-10"),
      materialType: "FIBER",
      transactionType: "ISSUE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 7,
      kgs: 420,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-15"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 10,
      kgs: 600,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-15"),
      materialType: "EXCEL",
      transactionType: "ISSUE",
      lotNo: EXCEL_LOT,
      partyName: SUPPLIERS.EXCEL,
      bags: 3,
      kgs: 180,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-20"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 10,
      kgs: 600,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-20"),
      materialType: "VISCOSE",
      transactionType: "ISSUE",
      lotNo: VISCOSE_LOT_2,
      partyName: SUPPLIERS.VISCOSE,
      bags: 4,
      kgs: 240,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-25"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 9,
      kgs: 540,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-25"),
      materialType: "FIBER",
      transactionType: "ISSUE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 5,
      kgs: 300,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-04-30"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_APR,
      partyName: SUPPLIERS.COTTON,
      bags: 8,
      kgs: 480,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Month end issue",
    },

    // ─── APRIL WASTE ─────────────────────────────────────────
    {
      date: date("2026-04-15"),
      materialType: "WASTE",
      transactionType: "PURCHASE",
      lotNo: "WASTE-APR-1",
      partyName: "Production Floor",
      bags: 3.5,
      kgs: 210,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Mid-month waste",
    },
    {
      date: date("2026-04-30"),
      materialType: "WASTE",
      transactionType: "PURCHASE",
      lotNo: "WASTE-APR-2",
      partyName: "Production Floor",
      bags: 3,
      kgs: 180,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Month-end waste",
    },

    // ─── MAY PURCHASES ───────────────────────────────────────
    {
      date: date("2026-04-28"),
      materialType: "COTTON",
      transactionType: "PURCHASE",
      lotNo: COTTON_LOT_MAY,
      partyName: SUPPLIERS.COTTON,
      bags: 100,
      kgs: 6000,
      pricePerBag: 5400,
      totalPrice: 540000,
      remarks: "May cotton purchase",
    },
    {
      date: date("2026-04-29"),
      materialType: "FIBER",
      transactionType: "PURCHASE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 20,
      kgs: 1200,
      pricePerBag: 4950,
      totalPrice: 99000,
      remarks: "Fiber top-up",
    },
    {
      date: date("2026-04-30"),
      materialType: "VISCOSE",
      transactionType: "PURCHASE",
      lotNo: VISCOSE_LOT_2,
      partyName: SUPPLIERS.VISCOSE,
      bags: 15,
      kgs: 900,
      pricePerBag: 5650,
      totalPrice: 84750,
      remarks: "Viscose May stock",
    },
    {
      date: date("2026-05-02"),
      materialType: "EXCEL",
      transactionType: "PURCHASE",
      lotNo: EXCEL_LOT,
      partyName: SUPPLIERS.EXCEL,
      bags: 10,
      kgs: 600,
      pricePerBag: 6400,
      totalPrice: 64000,
      remarks: null,
    },

    // ─── MAY ISSUES (May 1–10) ───────────────────────────────
    {
      date: date("2026-05-01"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAY,
      partyName: SUPPLIERS.COTTON,
      bags: 9,
      kgs: 540,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Issue to production",
    },
    {
      date: date("2026-05-01"),
      materialType: "FIBER",
      transactionType: "ISSUE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 4,
      kgs: 240,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-05-03"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAY,
      partyName: SUPPLIERS.COTTON,
      bags: 8,
      kgs: 480,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-05-05"),
      materialType: "VISCOSE",
      transactionType: "ISSUE",
      lotNo: VISCOSE_LOT_2,
      partyName: SUPPLIERS.VISCOSE,
      bags: 5,
      kgs: 300,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-05-07"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAY,
      partyName: SUPPLIERS.COTTON,
      bags: 10,
      kgs: 600,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-05-07"),
      materialType: "EXCEL",
      transactionType: "ISSUE",
      lotNo: EXCEL_LOT,
      partyName: SUPPLIERS.EXCEL,
      bags: 3,
      kgs: 180,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-05-10"),
      materialType: "COTTON",
      transactionType: "ISSUE",
      lotNo: COTTON_LOT_MAY,
      partyName: SUPPLIERS.COTTON,
      bags: 7,
      kgs: 420,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },
    {
      date: date("2026-05-10"),
      materialType: "FIBER",
      transactionType: "ISSUE",
      lotNo: FIBER_LOT,
      partyName: SUPPLIERS.FIBER,
      bags: 3,
      kgs: 180,
      pricePerBag: null,
      totalPrice: null,
      remarks: null,
    },

    // ─── MAY WASTE ───────────────────────────────────────────
    {
      date: date("2026-05-08"),
      materialType: "WASTE",
      transactionType: "PURCHASE",
      lotNo: "WASTE-MAY-1",
      partyName: "Production Floor",
      bags: 2,
      kgs: 120,
      pricePerBag: null,
      totalPrice: null,
      remarks: "First week waste",
    },

    // ─── YARN PURCHASE (finished stock from autocorner) ──────
    {
      date: date("2026-03-20"),
      materialType: "YARN",
      transactionType: "PURCHASE",
      lotNo: YARN_LOT_1,
      partyName: "Autocorner Floor",
      bags: 20,
      kgs: 1200,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Yarn from autocorner to stock",
    },
    {
      date: date("2026-04-22"),
      materialType: "YARN",
      transactionType: "PURCHASE",
      lotNo: YARN_LOT_2,
      partyName: "Autocorner Floor",
      bags: 25,
      kgs: 1500,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Yarn from autocorner to stock",
    },
    {
      date: date("2026-05-05"),
      materialType: "YARN",
      transactionType: "PURCHASE",
      lotNo: YARN_LOT_3,
      partyName: "Autocorner Floor",
      bags: 15,
      kgs: 900,
      pricePerBag: null,
      totalPrice: null,
      remarks: "Yarn to stock May",
    },
  ];

  await prisma.stockTransaction.createMany({ data: stockTxns });
  console.log(`  → ${stockTxns.length} stock transactions created`);

  // ═══════════════════════════════════════════════════════════════
  // 3. PACKING ENTRIES — across all 3 months
  // ═══════════════════════════════════════════════════════════════
  console.log("📦 Seeding packing entries...");
  const packingEntries = [
    // March
    {
      date: date("2026-03-05"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 4,
      kgs: 240,
      lotNo: YARN_LOT_1,
      remarks: null,
    },
    {
      date: date("2026-03-10"),
      source: "AUTOCORNER",
      yarnType: "Cotton 41s",
      bags: 3,
      kgs: 180,
      lotNo: YARN_LOT_1,
      remarks: "Autocorner output",
    },
    {
      date: date("2026-03-15"),
      source: "PRODUCTION",
      yarnType: "Viscose 47s",
      bags: 5,
      kgs: 300,
      lotNo: YARN_LOT_1,
      remarks: null,
    },
    {
      date: date("2026-03-20"),
      source: "AUTOCORNER",
      yarnType: "Cotton 41s",
      bags: 4,
      kgs: 240,
      lotNo: YARN_LOT_1,
      remarks: null,
    },
    {
      date: date("2026-03-25"),
      source: "PRODUCTION",
      yarnType: "Fiber Blend 47s",
      bags: 3.5,
      kgs: 210,
      lotNo: YARN_LOT_1,
      remarks: null,
    },
    {
      date: date("2026-03-28"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 5,
      kgs: 300,
      lotNo: YARN_LOT_1,
      remarks: "Large batch",
    },

    // April
    {
      date: date("2026-04-03"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 5,
      kgs: 300,
      lotNo: YARN_LOT_2,
      remarks: null,
    },
    {
      date: date("2026-04-07"),
      source: "AUTOCORNER",
      yarnType: "Viscose 47s",
      bags: 3,
      kgs: 180,
      lotNo: YARN_LOT_2,
      remarks: null,
    },
    {
      date: date("2026-04-12"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 6,
      kgs: 360,
      lotNo: YARN_LOT_2,
      remarks: null,
    },
    {
      date: date("2026-04-16"),
      source: "AUTOCORNER",
      yarnType: "Fiber Blend 47s",
      bags: 4,
      kgs: 240,
      lotNo: YARN_LOT_2,
      remarks: null,
    },
    {
      date: date("2026-04-22"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 5.5,
      kgs: 330,
      lotNo: YARN_LOT_2,
      remarks: "Premium batch",
    },
    {
      date: date("2026-04-26"),
      source: "AUTOCORNER",
      yarnType: "Excel Blend 41s",
      bags: 3,
      kgs: 180,
      lotNo: YARN_LOT_2,
      remarks: null,
    },
    {
      date: date("2026-04-29"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 4,
      kgs: 240,
      lotNo: YARN_LOT_2,
      remarks: null,
    },

    // May (1–10)
    {
      date: date("2026-05-02"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 4,
      kgs: 240,
      lotNo: YARN_LOT_3,
      remarks: null,
    },
    {
      date: date("2026-05-05"),
      source: "AUTOCORNER",
      yarnType: "Viscose 47s",
      bags: 3,
      kgs: 180,
      lotNo: YARN_LOT_3,
      remarks: null,
    },
    {
      date: date("2026-05-08"),
      source: "PRODUCTION",
      yarnType: "Cotton 41s",
      bags: 5,
      kgs: 300,
      lotNo: YARN_LOT_3,
      remarks: "Good run",
    },
    {
      date: date("2026-05-10"),
      source: "AUTOCORNER",
      yarnType: "Fiber Blend 47s",
      bags: 3.5,
      kgs: 210,
      lotNo: YARN_LOT_3,
      remarks: null,
    },
  ];

  await prisma.packingEntry.createMany({ data: packingEntries });
  console.log(`  → ${packingEntries.length} packing entries created`);

  // ═══════════════════════════════════════════════════════════════
  // 4. DISPATCH ENTRIES + STOCK TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════
  console.log("🚚 Seeding dispatch entries...");
  const dispatchData = [
    // March dispatches
    {
      date: "2026-03-12",
      materialType: "YARN",
      lotNo: YARN_LOT_1,
      partyName: BUYERS[0],
      bags: 8,
      pricePerBag: 7200,
      remarks: "March 1st dispatch",
    },
    {
      date: "2026-03-22",
      materialType: "YARN",
      lotNo: YARN_LOT_1,
      partyName: BUYERS[1],
      bags: 6,
      pricePerBag: 7350,
      remarks: null,
    },
    {
      date: "2026-03-29",
      materialType: "YARN",
      lotNo: YARN_LOT_1,
      partyName: BUYERS[2],
      bags: 5,
      pricePerBag: 7200,
      remarks: "March end dispatch",
    },

    // April dispatches
    {
      date: "2026-04-08",
      materialType: "YARN",
      lotNo: YARN_LOT_2,
      partyName: BUYERS[0],
      bags: 10,
      pricePerBag: 7400,
      remarks: "April 1st dispatch",
    },
    {
      date: "2026-04-16",
      materialType: "YARN",
      lotNo: YARN_LOT_2,
      partyName: BUYERS[3],
      bags: 7,
      pricePerBag: 7500,
      remarks: null,
    },
    {
      date: "2026-04-24",
      materialType: "YARN",
      lotNo: YARN_LOT_2,
      partyName: BUYERS[1],
      bags: 8,
      pricePerBag: 7400,
      remarks: null,
    },
    {
      date: "2026-04-30",
      materialType: "YARN",
      lotNo: YARN_LOT_2,
      partyName: BUYERS[4],
      bags: 5,
      pricePerBag: 7600,
      remarks: "Premium lot dispatch",
    },

    // May dispatches
    {
      date: "2026-05-06",
      materialType: "YARN",
      lotNo: YARN_LOT_3,
      partyName: BUYERS[2],
      bags: 6,
      pricePerBag: 7500,
      remarks: "May 1st dispatch",
    },
    {
      date: "2026-05-09",
      materialType: "YARN",
      lotNo: YARN_LOT_3,
      partyName: BUYERS[0],
      bags: 5,
      pricePerBag: 7600,
      remarks: null,
    },
  ];

  for (const d of dispatchData) {
    const kgs = d.bags * 60;
    const totalPrice = d.bags * d.pricePerBag;

    await prisma.dispatchEntry.create({
      data: {
        date: date(d.date),
        materialType: d.materialType,
        lotNo: d.lotNo,
        partyName: d.partyName,
        bags: d.bags,
        kgs,
        pricePerBag: d.pricePerBag,
        totalPrice,
        remarks: d.remarks,
      },
    });

    await prisma.stockTransaction.create({
      data: {
        date: date(d.date),
        materialType: d.materialType,
        transactionType: "DISPATCH",
        lotNo: d.lotNo,
        partyName: d.partyName,
        bags: d.bags,
        kgs,
        pricePerBag: d.pricePerBag,
        totalPrice,
        remarks: `Auto-created from dispatch`,
      },
    });
  }
  console.log(
    `  → ${dispatchData.length} dispatch entries + linked stock transactions`,
  );

  // ═══════════════════════════════════════════════════════════════
  // 5. EB ENTRIES — January through May 2026
  // ═══════════════════════════════════════════════════════════════
  console.log("⚡ Seeding EB entries...");
  const ebEntries = [
    { month: 1, year: 2026, openingUnits: 128400, closingUnits: 136200 }, // Jan: 7800 units
    { month: 2, year: 2026, openingUnits: 136200, closingUnits: 143500 }, // Feb: 7300 units
    { month: 3, year: 2026, openingUnits: 143500, closingUnits: 152100 }, // Mar: 8600 units
    { month: 4, year: 2026, openingUnits: 152100, closingUnits: 161400 }, // Apr: 9300 units
    { month: 5, year: 2026, openingUnits: 161400, closingUnits: 169800 }, // May: 8400 units (partial)
  ];

  await prisma.eBEntry.createMany({ data: ebEntries });
  console.log(`  → ${ebEntries.length} EB entries (Jan–May 2026)`);

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  const totalStockTxns = stockTxns.length + dispatchData.length;
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ SEED COMPLETE — SpinLytics Demo Data (2026 Standard)");
  console.log("═══════════════════════════════════════════════════════");
  console.log(
    `  Shift production entries : ${prodEntries.length}  (${allProdDates.length} working days × 6 rows)`,
  );
  console.log(
    `  Stock transactions       : ${totalStockTxns}  (purchases + issues + waste + dispatches)`,
  );
  console.log(`  Packing entries          : ${packingEntries.length}`);
  console.log(`  Dispatch entries         : ${dispatchData.length}`);
  console.log(
    `  EB entries               : ${ebEntries.length}  (Jan–May 2026)`,
  );
  console.log("");
  console.log("📊 Coverage:");
  console.log("  Production  → Mar 1–31, Apr 1–30, May 1–10, 2026 (Sun off)");
  console.log("  Stock       → Purchases + Issues all 3 months + YARN stock");
  console.log("  Packing     → 17 entries across Mar–May");
  console.log(
    `  Dispatch    → ${dispatchData.length} dispatches across 3 months`,
  );
  console.log("  EB          → Jan–May 2026 (5 months for trend)");
  console.log("");
  console.log("🔗 Suggested demo paths:");
  console.log("  • Daily Dashboard     → May 10, 2026  (today — live data)");
  console.log("  • Daily Dashboard     → May 1–9, 2026  (earlier this month)");
  console.log("  • Monthly Dashboard   → May 2026 / April 2026 / March 2026");
  console.log("  • Yearly Dashboard    → 2026 (shows Jan–May trend)");
  console.log("  • Stock Dashboard     → current stock with lot breakdown");
  console.log("  • Production Log      → 370+ entries to browse");
  console.log("  • Dispatch Log        → 9 dispatches across 3 buyers");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
