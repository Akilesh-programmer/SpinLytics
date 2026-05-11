const prisma = require("../config/database");
const {
  INFLOW_TYPES,
  OUTFLOW_TYPES,
  RAW_MATERIAL_TYPES,
} = require("../utils/constants");
const calc = require("../utils/calculations");
const { enrichWithCalculations } = require("./shift-production.service");

/**
 * ═══════════════════════════════════════════════════
 * Daily Dashboard — shift production summary for a specific date
 * ═══════════════════════════════════════════════════
 *
 * DATA SOURCE: shift_production_entries
 *
 * FORMULA MAPPING:
 *   Per-row (from enrichWithCalculations):
 *     - Production Kgs (Gross) = Actual HK × STD Constant
 *     - Actual Production (Net) = Gross − Waste
 *     - Waste % = (Waste / Gross) × 100
 *     - Worked Spindles = (Total − Idle) × (RunHrs / ShiftHrs)
 *     - Grams/Spindle = (Net × 1000) / Worked Spindles
 *     - Efficiency % = (Actual HK / STD HK) × 100
 *
 *   Aggregated (per-count and grand totals):
 *     - Total Gross/Net Production = SUM of all rows
 *     - Avg Efficiency = (SUM Actual HK / SUM STD HK) × 100
 *     - Total Waste = SUM of wasteKgs
 *     - Waste % = (Total Waste / Total Gross) × 100
 */
async function getDailySummary(date) {
  const entries = await prisma.shiftProductionEntry.findMany({
    where: { date: new Date(date) },
    orderBy: [{ count: "asc" }, { rfNo: "asc" }],
  });

  const enriched = entries.map(enrichWithCalculations);

  // ─── Group by Count (frame) ───
  const countGroups = {};
  for (const entry of enriched) {
    const c = entry.count;
    if (!countGroups[c]) {
      countGroups[c] = {
        count: c,
        entries: [],
        totalGrossKgs: 0,
        totalNetKgs: 0,
        totalWasteKgs: 0,
        totalActualHK: 0,
        totalStdHK: 0,
      };
    }
    countGroups[c].entries.push(entry);
    countGroups[c].totalGrossKgs += parseFloat(
      entry.calculated.productionKgsGross,
    );
    countGroups[c].totalNetKgs += parseFloat(
      entry.calculated.actualProductionKgs,
    );
    countGroups[c].totalWasteKgs += parseFloat(entry.wasteKgs);
    countGroups[c].totalActualHK += parseFloat(entry.actualHK);
    countGroups[c].totalStdHK += parseFloat(entry.stdHK);
    if (entry.autocornerKg != null) {
      countGroups[c].totalAutocornerKgs = (countGroups[c].totalAutocornerKgs || 0) + parseFloat(entry.autocornerKg);
      countGroups[c].hasAutocorner = true;
    }
  }

  const countSummaries = Object.values(countGroups).map((g) => ({
    count: g.count,
    entryCount: g.entries.length,
    totalGrossKgs: g.totalGrossKgs.toFixed(3),
    totalNetKgs: g.totalNetKgs.toFixed(3),
    totalWasteKgs: g.totalWasteKgs.toFixed(3),
    wastePercent:
      g.totalGrossKgs > 0
        ? ((g.totalWasteKgs / g.totalGrossKgs) * 100).toFixed(2)
        : "0.00",
    avgEfficiency:
      g.totalStdHK > 0
        ? ((g.totalActualHK / g.totalStdHK) * 100).toFixed(2)
        : "0.00",
    overallYieldPercent:
      g.totalGrossKgs > 0
        ? ((g.totalNetKgs / g.totalGrossKgs) * 100).toFixed(2)
        : "0.00",
    ...(g.hasAutocorner ? {
      autocornerKgs: (g.totalAutocornerKgs || 0).toFixed(3),
      spinningLossKg: (g.totalGrossKgs - (g.totalAutocornerKgs || 0)).toFixed(3),
      spinningLossPercent: g.totalGrossKgs > 0 ? (((g.totalGrossKgs - (g.totalAutocornerKgs || 0)) / g.totalGrossKgs) * 100).toFixed(2) : "0.00",
      autocornerLossKg: ((g.totalAutocornerKgs || 0) - g.totalNetKgs).toFixed(3),
      autocornerLossPercent: (g.totalAutocornerKgs || 0) > 0 ? ((((g.totalAutocornerKgs || 0) - g.totalNetKgs) / (g.totalAutocornerKgs || 1)) * 100).toFixed(2) : "0.00",
    } : {}),
  }));

  // ─── Grand totals ───
  const grandGross = enriched.reduce(
    (s, e) => s + parseFloat(e.calculated.productionKgsGross),
    0,
  );
  const grandNet = enriched.reduce(
    (s, e) => s + parseFloat(e.calculated.actualProductionKgs),
    0,
  );
  const grandWaste = enriched.reduce((s, e) => s + parseFloat(e.wasteKgs), 0);
  const grandActualHK = enriched.reduce(
    (s, e) => s + parseFloat(e.actualHK),
    0,
  );
  const grandStdHK = enriched.reduce((s, e) => s + parseFloat(e.stdHK), 0);

  const grandAutocorner = enriched.reduce((s, e) => s + (e.autocornerKg != null ? parseFloat(e.autocornerKg) : 0), 0);
  const hasAnyAutocorner = enriched.some(e => e.autocornerKg != null);

  const totals = {
    totalGrossKgs: grandGross.toFixed(3),
    totalNetKgs: grandNet.toFixed(3),
    totalWasteKgs: grandWaste.toFixed(3),
    wastePercent:
      grandGross > 0 ? ((grandWaste / grandGross) * 100).toFixed(2) : "0.00",
    avgEfficiency:
      grandStdHK > 0 ? ((grandActualHK / grandStdHK) * 100).toFixed(2) : "0.00",
    overallYieldPercent:
      grandGross > 0 ? ((grandNet / grandGross) * 100).toFixed(2) : "0.00",
    totalLostKg: (grandGross - grandNet).toFixed(3),
    entryCount: enriched.length,
    ...(hasAnyAutocorner ? {
      totalAutocornerKgs: grandAutocorner.toFixed(3),
      spinningLossKg: (grandGross - grandAutocorner).toFixed(3),
      spinningLossPercent: grandGross > 0 ? (((grandGross - grandAutocorner) / grandGross) * 100).toFixed(2) : "0.00",
      autocornerLossKg: (grandAutocorner - grandNet).toFixed(3),
      autocornerLossPercent: grandAutocorner > 0 ? (((grandAutocorner - grandNet) / grandAutocorner) * 100).toFixed(2) : "0.00",
    } : {}),
    hasAutocornerData: hasAnyAutocorner,
  };

  // Collect stoppages/remarks
  const stoppages = enriched
    .filter((e) => e.stoppages)
    .map((e) => ({ rfNo: e.rfNo, count: e.count, stoppages: e.stoppages }));

  return { date, entries: enriched, countSummaries, totals, stoppages };
}

/**
 * ═══════════════════════════════════════════════════
 * Monthly Dashboard — aggregated production metrics for a month
 * ═══════════════════════════════════════════════════
 *
 * DATA SOURCES:
 *   A. shift_production_entries → Total Production (Gross/Net), Efficiency, Waste, Grams/Spindle
 *   B. stock_transactions (ISSUE, raw materials) → Cotton Issue
 *   C. stock_transactions (WASTE material) → Monthly Waste for Realisation
 *   D. eb_entries → EB Units Consumed
 *
 * FORMULA MAPPING (Monthly Report):
 *   Total Production (Gross) = SUM(Actual HK × STD Constant) for all rows in month
 *   Total Production (Net)   = Total Gross − Total Waste (from shift entries)
 *   Avg Efficiency           = (SUM Actual HK / SUM STD HK) × 100
 *   Cotton Issue             = Cotton + Fiber + Viscose + Excel (ISSUE transactions in month)
 *   Yarn Realisation %       = Total Gross Production / Cotton Issue × 100
 *   Waste % (Report)         = Stock Waste / Cotton Issue × 100
 *   Invisible Loss %         = 100 − Yarn Realisation − Waste %
 *   Monthly UKG              = EB Units Consumed / Total Gross Production
 */
async function getMonthlySummary(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  // ═══ SOURCE A: Shift Production Entries ═══
  const shiftEntries = await prisma.shiftProductionEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  // Enrich each entry with calculations
  const enriched = shiftEntries.map(enrichWithCalculations);

  // Calculate totals from shift entries
  let totalGrossKgs = 0;
  let totalNetKgs = 0;
  let totalShiftWaste = 0;
  let totalActualHK = 0;
  let totalStdHK = 0;
  let totalAutocornerKgs = 0;
  let hasAutocorner = false;

  // Count-wise (frame-wise) breakdown
  const countMap = {};

  for (const entry of enriched) {
    const gross = parseFloat(entry.calculated.productionKgsGross);
    const net = parseFloat(entry.calculated.actualProductionKgs);
    const waste = parseFloat(entry.wasteKgs);
    const actualHK = parseFloat(entry.actualHK);
    const stdHK = parseFloat(entry.stdHK);

    totalGrossKgs += gross;
    totalNetKgs += net;
    totalShiftWaste += waste;
    totalActualHK += actualHK;
    totalStdHK += stdHK;
    if (entry.autocornerKg != null) {
      totalAutocornerKgs += parseFloat(entry.calculated.productionKgsGross) > 0 ? parseFloat(entry.autocornerKg) : 0;
      hasAutocorner = true;
    }

    // Group by count (frame)
    const c = entry.count;
    if (!countMap[c]) {
      countMap[c] = {
        grossKgs: 0,
        netKgs: 0,
        wasteKgs: 0,
        actualHK: 0,
        stdHK: 0,
      };
    }
    countMap[c].grossKgs += gross;
    countMap[c].netKgs += net;
    countMap[c].wasteKgs += waste;
    countMap[c].actualHK += actualHK;
    countMap[c].stdHK += stdHK;
    if (entry.autocornerKg != null) {
      countMap[c].autocornerKgs = (countMap[c].autocornerKgs || 0) + parseFloat(entry.autocornerKg);
      countMap[c].hasAutocorner = true;
    }
  }

  // Count-wise production breakdown
  const countBreakdown = Object.entries(countMap).map(([count, data]) => ({
    count,
    grossKgs: data.grossKgs.toFixed(3),
    netKgs: data.netKgs.toFixed(3),
    wasteKgs: data.wasteKgs.toFixed(3),
    wastePercent:
      data.grossKgs > 0
        ? ((data.wasteKgs / data.grossKgs) * 100).toFixed(2)
        : "0.00",
    avgEfficiency:
      data.stdHK > 0 ? ((data.actualHK / data.stdHK) * 100).toFixed(2) : "0.00",
    overallYieldPercent:
      data.grossKgs > 0 ? ((data.netKgs / data.grossKgs) * 100).toFixed(2) : "0.00",
    percentOfTotal:
      totalGrossKgs > 0
        ? ((data.grossKgs / totalGrossKgs) * 100).toFixed(1)
        : "0.0",
    // 2-stage loss (only if autocorner data exists for this count)
    ...(data.hasAutocorner ? {
      autocornerKgs: (data.autocornerKgs || 0).toFixed(3),
      spinningLossKg: (data.grossKgs - (data.autocornerKgs || 0)).toFixed(3),
      spinningLossPercent: data.grossKgs > 0 ? (((data.grossKgs - (data.autocornerKgs || 0)) / data.grossKgs) * 100).toFixed(2) : "0.00",
      autocornerLossKg: ((data.autocornerKgs || 0) - data.netKgs).toFixed(3),
      autocornerLossPercent: (data.autocornerKgs || 0) > 0 ? ((((data.autocornerKgs || 0) - data.netKgs) / (data.autocornerKgs || 1)) * 100).toFixed(2) : "0.00",
    } : {}),
  }));

  // Days recorded
  const daysRecorded = new Set(
    shiftEntries.map((e) => e.date.toISOString().split("T")[0]),
  ).size;

  // ═══ SOURCE B: Stock ISSUE Transactions (Cotton Issue) ═══
  const stockTransactions = await prisma.stockTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      transactionType: "ISSUE",
    },
  });

  const rawMaterialIssues = { cotton: 0, fiber: 0, viscose: 0, excel: 0 };
  for (const txn of stockTransactions) {
    const kgs = parseFloat(txn.kgs);
    const type = txn.materialType.toLowerCase();
    if (rawMaterialIssues.hasOwnProperty(type)) {
      rawMaterialIssues[type] += kgs;
    }
  }

  const cottonIssue = calc.totalCottonIssue(rawMaterialIssues).toNumber();

  // ═══ SOURCE C: Waste Transactions (for Realisation calculation) ═══
  const wasteTransactions = await prisma.stockTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      materialType: "WASTE",
    },
  });

  const stockWaste = wasteTransactions.reduce((sum, t) => {
    const kgs = parseFloat(t.kgs);
    return INFLOW_TYPES.includes(t.transactionType) ? sum + kgs : sum - kgs;
  }, 0);

  // ═══ SOURCE D: EB Entry ═══
  const ebEntry = await prisma.eBEntry.findUnique({
    where: { month_year: { month, year } },
  });

  let ebUnits = 0;
  if (ebEntry) {
    ebUnits = calc
      .ebUnitsConsumed(
        parseFloat(ebEntry.closingUnits),
        parseFloat(ebEntry.openingUnits),
      )
      .toNumber();
  }

  // ═══ DERIVED METRICS ═══
  // Use totalGrossKgs as "Total Production" for Yarn Realisation & UKG
  const yarnRealisation = calc.yarnRealisationPercent(
    cottonIssue,
    totalGrossKgs,
  );
  const wastePct = calc.wastePercent(stockWaste, cottonIssue);
  const invLoss = calc.invisibleLoss(yarnRealisation, wastePct);
  const monthlyUkg = calc.ukg(ebUnits, totalGrossKgs);

  // ═══ OVERALL YIELD & TOTAL LOST ═══
  const overallYieldPct =
    totalGrossKgs > 0 ? (totalNetKgs / totalGrossKgs) * 100 : 0;
  const totalLostKg = totalGrossKgs - totalNetKgs;

  // ═══ DAY PERFORMANCE ═══
  const dayMap = {};
  for (const entry of enriched) {
    const dayKey = entry.date.toISOString().split("T")[0];
    if (!dayMap[dayKey]) dayMap[dayKey] = { gross: 0, net: 0, waste: 0, actualHK: 0, stdHK: 0 };
    dayMap[dayKey].gross += parseFloat(entry.calculated.productionKgsGross);
    dayMap[dayKey].net += parseFloat(entry.calculated.actualProductionKgs);
    dayMap[dayKey].waste += parseFloat(entry.wasteKgs);
    dayMap[dayKey].actualHK += parseFloat(entry.actualHK);
    dayMap[dayKey].stdHK += parseFloat(entry.stdHK);
  }

  const dayEntries = Object.entries(dayMap).map(([date, d]) => ({
    date,
    gross: d.gross,
    net: d.net,
    waste: d.waste,
    efficiency: d.stdHK > 0 ? (d.actualHK / d.stdHK) * 100 : 0,
    yieldPct: d.gross > 0 ? (d.net / d.gross) * 100 : 0,
  }));

  let dayPerformance = null;
  if (dayEntries.length > 0) {
    const bestDay = dayEntries.reduce((a, b) => (b.gross > a.gross ? b : a));
    const lowestDay = dayEntries.reduce((a, b) => (b.gross < a.gross ? b : a));
    const bestEffDay = dayEntries.reduce((a, b) => (b.efficiency > a.efficiency ? b : a));
    dayPerformance = {
      bestDay: { date: bestDay.date, grossKgs: bestDay.gross.toFixed(3) },
      lowestDay: { date: lowestDay.date, grossKgs: lowestDay.gross.toFixed(3) },
      bestEfficiencyDay: { date: bestEffDay.date, efficiency: bestEffDay.efficiency.toFixed(2) },
    };
  }

  return {
    year,
    month,
    production: {
      totalGrossKgs: totalGrossKgs.toFixed(3),
      totalNetKgs: totalNetKgs.toFixed(3),
      totalShiftWasteKgs: totalShiftWaste.toFixed(3),
      shiftWastePercent:
        totalGrossKgs > 0
          ? ((totalShiftWaste / totalGrossKgs) * 100).toFixed(2)
          : "0.00",
      avgEfficiency:
        totalStdHK > 0
          ? ((totalActualHK / totalStdHK) * 100).toFixed(2)
          : "0.00",
      overallYieldPercent: overallYieldPct.toFixed(2),
      totalLostKg: totalLostKg.toFixed(3),
      // 2-stage loss analysis (only when autocorner data present)
      ...(hasAutocorner ? {
        totalAutocornerKgs: totalAutocornerKgs.toFixed(3),
        spinningLossKg: (totalGrossKgs - totalAutocornerKgs).toFixed(3),
        spinningLossPercent: totalGrossKgs > 0 ? (((totalGrossKgs - totalAutocornerKgs) / totalGrossKgs) * 100).toFixed(2) : "0.00",
        autocornerLossKg: (totalAutocornerKgs - totalNetKgs).toFixed(3),
        autocornerLossPercent: totalAutocornerKgs > 0 ? (((totalAutocornerKgs - totalNetKgs) / totalAutocornerKgs) * 100).toFixed(2) : "0.00",
      } : {}),
      hasAutocornerData: hasAutocorner,
      daysRecorded,
      countBreakdown,
    },
    rawMaterials: {
      cottonIssueKg: rawMaterialIssues.cotton.toFixed(3),
      fiberIssueKg: rawMaterialIssues.fiber.toFixed(3),
      viscoseIssueKg: rawMaterialIssues.viscose.toFixed(3),
      excelIssueKg: rawMaterialIssues.excel.toFixed(3),
      totalCottonIssueKg: cottonIssue.toFixed(3),
    },
    metrics: {
      yarnRealisationPercent: yarnRealisation.toFixed(2),
      wastePercent: wastePct.toFixed(2),
      invisibleLossPercent: invLoss.toFixed(2),
      totalStockWasteKg: stockWaste.toFixed(3),
      rawMaterialEfficiencyPercent:
        cottonIssue > 0 ? ((totalGrossKgs / cottonIssue) * 100).toFixed(2) : "0.00",
    },
    energy: {
      ebUnitsConsumed: ebUnits.toFixed(3),
      ukg: monthlyUkg.toFixed(4),
    },
    dayPerformance,
  };
}

/**
 * ═══════════════════════════════════════════════════
 * Yearly Dashboard — aggregated monthly summaries for a year
 * ═══════════════════════════════════════════════════
 *
 * Generates monthly summary for each of 12 months, then frontend aggregates.
 * Same formulas as monthly, but summed across 12 months.
 */
async function getYearlySummary(year) {
  const months = [];

  for (let month = 1; month <= 12; month++) {
    try {
      const summary = await getMonthlySummary(year, month);
      months.push(summary);
    } catch {
      months.push({
        year,
        month,
        production: {
          totalGrossKgs: "0.000",
          totalNetKgs: "0.000",
          countBreakdown: [],
        },
        rawMaterials: {},
        metrics: {},
        energy: {},
      });
    }
  }

  // Calculate yearly totals
  const yearlyGross = months.reduce(
    (s, m) => s + parseFloat(m.production.totalGrossKgs || 0),
    0,
  );
  const yearlyNet = months.reduce(
    (s, m) => s + parseFloat(m.production.totalNetKgs || 0),
    0,
  );

  return {
    year,
    months,
    yearlyTotals: {
      totalGrossKgs: yearlyGross.toFixed(3),
      totalNetKgs: yearlyNet.toFixed(3),
    },
  };
}

/**
 * ═══════════════════════════════════════════════════
 * Stock Dashboard — current stock overview
 * ═══════════════════════════════════════════════════
 *
 * No change in logic — still sums all stock transactions.
 * Stock = SUM(PURCHASE + RETURN) − SUM(ISSUE + DISPATCH)
 */
async function getStockDashboard() {
  // Get current stock per material
  const stockResult = await prisma.stockTransaction.groupBy({
    by: ["materialType", "transactionType"],
    _sum: { kgs: true, bags: true },
  });

  const stockMap = {};
  for (const row of stockResult) {
    if (!stockMap[row.materialType]) {
      stockMap[row.materialType] = { kgs: 0, bags: 0 };
    }
    const kgs = parseFloat(row._sum.kgs) || 0;
    const bags = parseFloat(row._sum.bags) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      stockMap[row.materialType].kgs += kgs;
      stockMap[row.materialType].bags += bags;
    } else {
      stockMap[row.materialType].kgs -= kgs;
      stockMap[row.materialType].bags -= bags;
    }
  }

  const currentStock = Object.entries(stockMap).map(([material, data]) => ({
    materialType: material,
    currentStockKg: parseFloat(data.kgs.toFixed(3)),
    currentStockBags: parseFloat(data.bags.toFixed(2)),
  }));

  // Get lot-wise summary
  const lotResult = await prisma.stockTransaction.groupBy({
    by: ["materialType", "lotNo", "transactionType"],
    _sum: { kgs: true },
  });

  const lotMap = {};
  for (const row of lotResult) {
    const key = `${row.materialType}::${row.lotNo}`;
    if (!lotMap[key]) {
      lotMap[key] = {
        materialType: row.materialType,
        lotNo: row.lotNo,
        kgs: 0,
      };
    }
    const kgs = parseFloat(row._sum.kgs) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      lotMap[key].kgs += kgs;
    } else {
      lotMap[key].kgs -= kgs;
    }
  }

  const lotWise = Object.values(lotMap)
    .filter((item) => item.kgs > 0)
    .map((item) => ({ ...item, kgs: parseFloat(item.kgs.toFixed(3)) }));

  // Recent transactions
  const recentTransactions = await prisma.stockTransaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return {
    currentStock,
    lotWise,
    recentTransactions,
  };
}

module.exports = {
  getDailySummary,
  getMonthlySummary,
  getYearlySummary,
  getStockDashboard,
};
