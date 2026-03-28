const prisma = require('../config/database');
const { INFLOW_TYPES, OUTFLOW_TYPES } = require('../utils/constants');
const calc = require('../utils/calculations');

/**
 * Daily Dashboard — production summary for a specific date
 * Shows both frames, losses, UKG, and GPS
 */
async function getDailySummary(date) {
  const entries = await prisma.productionEntry.findMany({
    where: { date: new Date(date) },
    orderBy: { frameNumber: 'asc' },
  });

  const frames = entries.map((entry) => {
    const prod = parseFloat(entry.productionKg);
    const auto = parseFloat(entry.autocornerProductionKg);
    const pack = parseFloat(entry.packingKg);
    const eb = parseFloat(entry.ebUnits);
    const spindles = entry.noOfSpindles;

    return {
      ...entry,
      calculated: {
        spinningLossKg: calc.spinningLoss(prod, auto).toFixed(3),
        spinningLossPercent: calc.spinningLossPercent(prod, auto).toFixed(2),
        autocornerLossKg: calc.autocornerLoss(auto, pack).toFixed(3),
        autocornerLossPercent: calc.autocornerLossPercent(auto, pack).toFixed(2),
        ukg: calc.ukg(eb, prod).toFixed(4),
        gps: calc.gps(prod, spindles).toFixed(4),
      },
    };
  });

  // Calculate combined totals
  let totals = null;
  if (frames.length > 0) {
    const totalProd = frames.reduce((sum, e) => sum + parseFloat(e.productionKg), 0);
    const totalAuto = frames.reduce((sum, e) => sum + parseFloat(e.autocornerProductionKg), 0);
    const totalPack = frames.reduce((sum, e) => sum + parseFloat(e.packingKg), 0);
    const totalEB = frames.reduce((sum, e) => sum + parseFloat(e.ebUnits), 0);
    const totalSpindles = frames.reduce((sum, e) => sum + e.noOfSpindles, 0);

    totals = {
      totalProductionKg: totalProd.toFixed(3),
      totalAutocornerKg: totalAuto.toFixed(3),
      totalPackingKg: totalPack.toFixed(3),
      totalEBUnits: totalEB.toFixed(3),
      totalSpindles,
      spinningLossPercent: calc.spinningLossPercent(totalProd, totalAuto).toFixed(2),
      autocornerLossPercent: calc.autocornerLossPercent(totalAuto, totalPack).toFixed(2),
      ukg: calc.ukg(totalEB, totalProd).toFixed(4),
      gps: calc.gps(totalProd, totalSpindles).toFixed(4),
    };
  }

  return { date, frames, totals };
}

/**
 * Monthly Dashboard — aggregated production metrics for a month
 * Includes: total production, cotton issue, yarn realisation %, waste %, invisible loss, UKG
 */
async function getMonthlySummary(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  // Get all production entries for the month
  const productionEntries = await prisma.productionEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  // Calculate total production
  const totalProduction = productionEntries.reduce(
    (sum, e) => sum + parseFloat(e.productionKg), 0
  );
  const totalAutocorner = productionEntries.reduce(
    (sum, e) => sum + parseFloat(e.autocornerProductionKg), 0
  );
  const totalPacking = productionEntries.reduce(
    (sum, e) => sum + parseFloat(e.packingKg), 0
  );

  // Frame-wise breakdown
  const frame41 = productionEntries
    .filter((e) => e.frameNumber === 'FRAME_41')
    .reduce((sum, e) => sum + parseFloat(e.productionKg), 0);
  const frame47 = productionEntries
    .filter((e) => e.frameNumber === 'FRAME_47')
    .reduce((sum, e) => sum + parseFloat(e.productionKg), 0);

  // Get stock transactions for the month (to calculate cotton issue)
  const stockTransactions = await prisma.stockTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      transactionType: 'ISSUE',
    },
  });

  // Cotton Issue = Cotton + Fiber + Viscose + Excel (all raw material issues)
  const rawMaterialIssues = {
    cotton: 0, fiber: 0, viscose: 0, excel: 0,
  };

  for (const txn of stockTransactions) {
    const kgs = parseFloat(txn.kgs);
    const type = txn.materialType.toLowerCase();
    if (rawMaterialIssues.hasOwnProperty(type)) {
      rawMaterialIssues[type] += kgs;
    }
  }

  const cottonIssue = calc.totalCottonIssue(rawMaterialIssues).toNumber();

  // Get waste for the month
  const wasteTransactions = await prisma.stockTransaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      materialType: 'WASTE',
    },
  });
  const totalWaste = wasteTransactions.reduce((sum, t) => {
    const kgs = parseFloat(t.kgs);
    return INFLOW_TYPES.includes(t.transactionType) ? sum + kgs : sum - kgs;
  }, 0);

  // Get EB entry for this month
  const ebEntry = await prisma.eBEntry.findUnique({
    where: { month_year: { month, year } },
  });

  let ebUnits = 0;
  if (ebEntry) {
    ebUnits = calc.ebUnitsConsumed(
      parseFloat(ebEntry.closingUnits),
      parseFloat(ebEntry.openingUnits)
    ).toNumber();
  }

  // Calculate derived metrics
  const yarnRealisation = calc.yarnRealisationPercent(cottonIssue, totalProduction);
  const wastePct = calc.wastePercent(totalWaste, cottonIssue);
  const invLoss = calc.invisibleLoss(yarnRealisation, wastePct);
  const monthlyUkg = calc.ukg(ebUnits, totalProduction);

  return {
    year,
    month,
    production: {
      frame41Kg: frame41.toFixed(3),
      frame47Kg: frame47.toFixed(3),
      totalProductionKg: totalProduction.toFixed(3),
      totalAutocornerKg: totalAutocorner.toFixed(3),
      totalPackingKg: totalPacking.toFixed(3),
      spinningLossPercent: calc.spinningLossPercent(totalProduction, totalAutocorner).toFixed(2),
      autocornerLossPercent: calc.autocornerLossPercent(totalAutocorner, totalPacking).toFixed(2),
      daysRecorded: new Set(productionEntries.map(e => e.date.toISOString().split('T')[0])).size,
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
      totalWasteKg: totalWaste.toFixed(3),
    },
    energy: {
      ebUnitsConsumed: ebUnits.toFixed(3),
      ukg: monthlyUkg.toFixed(4),
    },
  };
}

/**
 * Yearly Dashboard — aggregated monthly summaries for a year
 */
async function getYearlySummary(year) {
  const months = [];

  for (let month = 1; month <= 12; month++) {
    try {
      const summary = await getMonthlySummary(year, month);
      months.push(summary);
    } catch {
      // Skip months with no data
      months.push({
        year,
        month,
        production: { totalProductionKg: '0.000' },
        metrics: {},
        energy: {},
      });
    }
  }

  // Calculate yearly totals
  const yearlyTotalProduction = months.reduce(
    (sum, m) => sum + parseFloat(m.production.totalProductionKg || 0), 0
  );

  return {
    year,
    months,
    yearlyTotals: {
      totalProductionKg: yearlyTotalProduction.toFixed(3),
    },
  };
}

/**
 * Stock Dashboard — current overview
 */
async function getStockDashboard() {
  // Get current stock per material
  const stockResult = await prisma.stockTransaction.groupBy({
    by: ['materialType', 'transactionType'],
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
    by: ['materialType', 'lotNo', 'transactionType'],
    _sum: { kgs: true },
  });

  const lotMap = {};
  for (const row of lotResult) {
    const key = `${row.materialType}::${row.lotNo}`;
    if (!lotMap[key]) {
      lotMap[key] = { materialType: row.materialType, lotNo: row.lotNo, kgs: 0 };
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
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
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
