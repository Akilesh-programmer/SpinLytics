const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const calc = require('../utils/calculations');

/**
 * Enriches a shift production entry with the 6 auto-calculated fields.
 * These are NEVER stored — always computed fresh.
 */
function enrichWithCalculations(entry) {
  const actualHK = parseFloat(entry.actualHK);
  const stdConstant = parseFloat(entry.stdConstant);
  const stdHK = parseFloat(entry.stdHK);
  const wasteKgs = parseFloat(entry.wasteKgs);
  const totalSpindles = entry.totalSpindlesPerMachine;
  const idleSpindles = entry.idleSpindles;
  const runHrs = parseFloat(entry.runHrs);
  const shiftHours = parseFloat(entry.shiftHours);

  // Formula 1: Production Kgs (Gross) = Actual HK × STD Constant
  const grossKgs = calc.productionKgsGross(actualHK, stdConstant);

  // Formula 2: Actual Production Kgs (Net) = Gross − Waste
  const netKgs = calc.actualProductionKgs(grossKgs, wasteKgs);

  // Formula 3: Waste % = (Waste / Gross) × 100
  const wastePct = calc.wastePercentShift(wasteKgs, grossKgs);

  // Formula 4: Worked Spindles = (Total − Idle) × (RunHrs / ShiftHrs)
  const ws = calc.workedSpindles(totalSpindles, idleSpindles, runHrs, shiftHours);

  // Formula 5: Grams per Spindle = (Net × 1000) / Worked Spindles
  const gps = calc.gramsPerSpindle(netKgs, ws);

  // Formula 6: Efficiency % = (Actual HK / STD HK) × 100
  const efficiency = calc.efficiencyPercent(actualHK, stdHK);

  // 2-Stage Loss Analysis (only when autocornerKg is provided)
  const autoKg = entry.autocornerKg;
  const spinLossKg = calc.spinningLossKg(grossKgs, autoKg);
  const spinLossPct = calc.spinningLossPercent(grossKgs, autoKg);
  const autoLossKg = calc.autocornerLossKg(autoKg, netKgs);
  const autoLossPct = calc.autocornerLossPercent(autoKg, netKgs);
  const yieldPct = calc.overallYieldPercent(netKgs, grossKgs);

  return {
    ...entry,
    calculated: {
      productionKgsGross: grossKgs.toFixed(3),
      actualProductionKgs: netKgs.toFixed(3),
      wastePercent: wastePct.toFixed(2),
      workedSpindles: ws.toFixed(1),
      gramsPerSpindle: gps.toFixed(4),
      efficiencyPercent: efficiency.toFixed(2),
      overallYieldPercent: yieldPct.toFixed(2),
      // 2-stage loss (null if autocorner not entered)
      spinningLossKg: spinLossKg !== null ? spinLossKg.toFixed(3) : null,
      spinningLossPercent: spinLossPct !== null ? spinLossPct.toFixed(2) : null,
      autocornerLossKg: autoLossKg !== null ? autoLossKg.toFixed(3) : null,
      autocornerLossPercent: autoLossPct !== null ? autoLossPct.toFixed(2) : null,
    },
  };
}

/**
 * Create a single shift production entry (auto-save individual row)
 */
async function createSingle(data) {
  const entry = await prisma.shiftProductionEntry.create({
    data: {
      date: new Date(data.date),
      shiftHours: data.shiftHours,
      totalSpindlesPerMachine: data.totalSpindlesPerMachine,
      rfNo: data.rfNo,
      siderName: data.siderName,
      count: data.count,
      stdConstant: data.stdConstant,
      stdHK: data.stdHK,
      actualHK: data.actualHK,
      runHrs: data.runHrs,
      idleSpindles: data.idleSpindles || 0,
      wasteKgs: data.wasteKgs,
      autocornerKg: data.autocornerKg != null ? data.autocornerKg : null,
      stoppages: data.stoppages || null,
    },
  });

  return enrichWithCalculations(entry);
}

/**
 * Create a batch of shift production entries (Save All)
 * All rows share the same session settings (date, shiftHours, totalSpindles)
 */
async function createBatch(data) {
  const { date, shiftHours, totalSpindlesPerMachine, rows } = data;

  const entries = await prisma.$transaction(
    rows.map((row) =>
      prisma.shiftProductionEntry.create({
        data: {
          date: new Date(date),
          shiftHours,
          totalSpindlesPerMachine,
          rfNo: row.rfNo,
          siderName: row.siderName,
          count: row.count,
          stdConstant: row.stdConstant,
          stdHK: row.stdHK,
          actualHK: row.actualHK,
          runHrs: row.runHrs,
          idleSpindles: row.idleSpindles || 0,
          wasteKgs: row.wasteKgs,
          autocornerKg: row.autocornerKg != null ? row.autocornerKg : null,
          stoppages: row.stoppages || null,
        },
      })
    )
  );

  return entries.map(enrichWithCalculations);
}

/**
 * Get all shift production entries with filters and pagination
 */
async function findAll(query) {
  const { startDate, endDate, rfNo, count, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (rfNo) where.rfNo = rfNo;
  if (count) where.count = count;

  const [entries, total] = await Promise.all([
    prisma.shiftProductionEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { rfNo: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.shiftProductionEntry.count({ where }),
  ]);

  return {
    data: entries.map(enrichWithCalculations),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all entries for a specific date (for daily dashboard)
 */
async function findByDate(date) {
  const entries = await prisma.shiftProductionEntry.findMany({
    where: { date: new Date(date) },
    orderBy: [{ count: 'asc' }, { rfNo: 'asc' }],
  });

  const enriched = entries.map(enrichWithCalculations);

  // Group by count (frame) and calculate per-count totals
  const countGroups = {};
  for (const entry of enriched) {
    const c = entry.count;
    if (!countGroups[c]) {
      countGroups[c] = { count: c, entries: [], totalGrossKgs: 0, totalNetKgs: 0, totalWasteKgs: 0, totalActualHK: 0, totalStdHK: 0 };
    }
    countGroups[c].entries.push(entry);
    countGroups[c].totalGrossKgs += parseFloat(entry.calculated.productionKgsGross);
    countGroups[c].totalNetKgs += parseFloat(entry.calculated.actualProductionKgs);
    countGroups[c].totalWasteKgs += parseFloat(entry.wasteKgs);
    countGroups[c].totalActualHK += parseFloat(entry.actualHK);
    countGroups[c].totalStdHK += parseFloat(entry.stdHK);
  }

  // Calculate per-count summary metrics
  const countSummaries = Object.values(countGroups).map((group) => ({
    count: group.count,
    entryCount: group.entries.length,
    totalGrossKgs: group.totalGrossKgs.toFixed(3),
    totalNetKgs: group.totalNetKgs.toFixed(3),
    totalWasteKgs: group.totalWasteKgs.toFixed(3),
    wastePercent: group.totalGrossKgs > 0 ? ((group.totalWasteKgs / group.totalGrossKgs) * 100).toFixed(2) : '0.00',
    avgEfficiency: group.totalStdHK > 0 ? ((group.totalActualHK / group.totalStdHK) * 100).toFixed(2) : '0.00',
  }));

  // Grand totals across all counts
  const grandTotalGross = enriched.reduce((sum, e) => sum + parseFloat(e.calculated.productionKgsGross), 0);
  const grandTotalNet = enriched.reduce((sum, e) => sum + parseFloat(e.calculated.actualProductionKgs), 0);
  const grandTotalWaste = enriched.reduce((sum, e) => sum + parseFloat(e.wasteKgs), 0);
  const grandTotalActualHK = enriched.reduce((sum, e) => sum + parseFloat(e.actualHK), 0);
  const grandTotalStdHK = enriched.reduce((sum, e) => sum + parseFloat(e.stdHK), 0);

  const totals = {
    totalGrossKgs: grandTotalGross.toFixed(3),
    totalNetKgs: grandTotalNet.toFixed(3),
    totalWasteKgs: grandTotalWaste.toFixed(3),
    wastePercent: grandTotalGross > 0 ? ((grandTotalWaste / grandTotalGross) * 100).toFixed(2) : '0.00',
    avgEfficiency: grandTotalStdHK > 0 ? ((grandTotalActualHK / grandTotalStdHK) * 100).toFixed(2) : '0.00',
    entryCount: enriched.length,
  };

  return { entries: enriched, countSummaries, totals };
}

/**
 * Get a single entry by ID
 */
async function findById(id) {
  const entry = await prisma.shiftProductionEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw ApiError.notFound('Shift production entry not found');
  }

  return enrichWithCalculations(entry);
}

/**
 * Update a shift production entry
 */
async function update(id, data) {
  const existing = await prisma.shiftProductionEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Shift production entry not found');
  }

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.shiftHours !== undefined) updateData.shiftHours = data.shiftHours;
  if (data.totalSpindlesPerMachine !== undefined) updateData.totalSpindlesPerMachine = data.totalSpindlesPerMachine;
  if (data.rfNo !== undefined) updateData.rfNo = data.rfNo;
  if (data.siderName !== undefined) updateData.siderName = data.siderName;
  if (data.count !== undefined) updateData.count = data.count;
  if (data.stdConstant !== undefined) updateData.stdConstant = data.stdConstant;
  if (data.stdHK !== undefined) updateData.stdHK = data.stdHK;
  if (data.actualHK !== undefined) updateData.actualHK = data.actualHK;
  if (data.runHrs !== undefined) updateData.runHrs = data.runHrs;
  if (data.idleSpindles !== undefined) updateData.idleSpindles = data.idleSpindles;
  if (data.wasteKgs !== undefined) updateData.wasteKgs = data.wasteKgs;
  if (data.stoppages !== undefined) updateData.stoppages = data.stoppages;

  const entry = await prisma.shiftProductionEntry.update({
    where: { id },
    data: updateData,
  });

  return enrichWithCalculations(entry);
}

/**
 * Delete a shift production entry
 */
async function remove(id) {
  const existing = await prisma.shiftProductionEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Shift production entry not found');
  }

  await prisma.shiftProductionEntry.delete({
    where: { id },
  });

  return { id };
}

module.exports = {
  enrichWithCalculations,
  createSingle,
  createBatch,
  findAll,
  findByDate,
  findById,
  update,
  remove,
};
