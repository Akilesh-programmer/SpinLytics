const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { spinningLoss, spinningLossPercent, autocornerLoss, autocornerLossPercent, ukg, gps } = require('../utils/calculations');

/**
 * Enriches a production entry with computed metrics
 */
function enrichWithCalculations(entry) {
  const prod = parseFloat(entry.productionKg);
  const auto = parseFloat(entry.autocornerProductionKg);
  const pack = parseFloat(entry.packingKg);
  const eb = parseFloat(entry.ebUnits);
  const spindles = entry.noOfSpindles;

  return {
    ...entry,
    calculated: {
      spinningLossKg: spinningLoss(prod, auto).toFixed(3),
      spinningLossPercent: spinningLossPercent(prod, auto).toFixed(2),
      autocornerLossKg: autocornerLoss(auto, pack).toFixed(3),
      autocornerLossPercent: autocornerLossPercent(auto, pack).toFixed(2),
      ukg: ukg(eb, prod).toFixed(4),
      gps: gps(prod, spindles).toFixed(4),
    },
  };
}

/**
 * Create a new production entry
 */
async function create(data) {
  // Check for duplicate (date + frame)
  const existing = await prisma.productionEntry.findUnique({
    where: {
      date_frameNumber: {
        date: new Date(data.date),
        frameNumber: data.frameNumber,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict(
      `Production entry already exists for ${data.date} - ${data.frameNumber}`
    );
  }

  const entry = await prisma.productionEntry.create({
    data: {
      date: new Date(data.date),
      frameNumber: data.frameNumber,
      productionKg: data.productionKg,
      autocornerProductionKg: data.autocornerProductionKg,
      packingKg: data.packingKg,
      ebUnits: data.ebUnits,
      noOfSpindles: data.noOfSpindles,
      remarks: data.remarks || null,
    },
  });

  return enrichWithCalculations(entry);
}

/**
 * Get all production entries with filters and pagination
 */
async function findAll(query) {
  const { startDate, endDate, frameNumber, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  if (frameNumber) {
    where.frameNumber = frameNumber;
  }

  const [entries, total] = await Promise.all([
    prisma.productionEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { frameNumber: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.productionEntry.count({ where }),
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
 * Get a single production entry by ID
 */
async function findById(id) {
  const entry = await prisma.productionEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw ApiError.notFound('Production entry not found');
  }

  return enrichWithCalculations(entry);
}

/**
 * Get both frames for a specific date (daily view)
 */
async function findByDate(date) {
  const entries = await prisma.productionEntry.findMany({
    where: { date: new Date(date) },
    orderBy: { frameNumber: 'asc' },
  });

  const enriched = entries.map(enrichWithCalculations);

  // Calculate totals if both frames present
  let totals = null;
  if (enriched.length === 2) {
    const totalProd = enriched.reduce((sum, e) => sum + parseFloat(e.productionKg), 0);
    const totalAuto = enriched.reduce((sum, e) => sum + parseFloat(e.autocornerProductionKg), 0);
    const totalPack = enriched.reduce((sum, e) => sum + parseFloat(e.packingKg), 0);
    const totalEB = enriched.reduce((sum, e) => sum + parseFloat(e.ebUnits), 0);
    const totalSpindles = enriched.reduce((sum, e) => sum + e.noOfSpindles, 0);

    totals = {
      totalProductionKg: totalProd.toFixed(3),
      totalAutocornerKg: totalAuto.toFixed(3),
      totalPackingKg: totalPack.toFixed(3),
      totalEBUnits: totalEB.toFixed(3),
      totalSpindles,
      spinningLossPercent: spinningLossPercent(totalProd, totalAuto).toFixed(2),
      autocornerLossPercent: autocornerLossPercent(totalAuto, totalPack).toFixed(2),
      ukg: ukg(totalEB, totalProd).toFixed(4),
      gps: gps(totalProd, totalSpindles).toFixed(4),
    };
  }

  return { frames: enriched, totals };
}

/**
 * Update a production entry
 */
async function update(id, data) {
  const existing = await prisma.productionEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Production entry not found');
  }

  // If changing date or frame, check for conflicts
  if (data.date || data.frameNumber) {
    const newDate = data.date ? new Date(data.date) : existing.date;
    const newFrame = data.frameNumber || existing.frameNumber;

    const conflict = await prisma.productionEntry.findFirst({
      where: {
        date: newDate,
        frameNumber: newFrame,
        NOT: { id },
      },
    });

    if (conflict) {
      throw ApiError.conflict(
        `Production entry already exists for that date and frame`
      );
    }
  }

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.frameNumber) updateData.frameNumber = data.frameNumber;
  if (data.productionKg !== undefined) updateData.productionKg = data.productionKg;
  if (data.autocornerProductionKg !== undefined) updateData.autocornerProductionKg = data.autocornerProductionKg;
  if (data.packingKg !== undefined) updateData.packingKg = data.packingKg;
  if (data.ebUnits !== undefined) updateData.ebUnits = data.ebUnits;
  if (data.noOfSpindles !== undefined) updateData.noOfSpindles = data.noOfSpindles;
  if (data.remarks !== undefined) updateData.remarks = data.remarks;

  const entry = await prisma.productionEntry.update({
    where: { id },
    data: updateData,
  });

  return enrichWithCalculations(entry);
}

/**
 * Delete a production entry
 */
async function remove(id) {
  const existing = await prisma.productionEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Production entry not found');
  }

  await prisma.productionEntry.delete({
    where: { id },
  });

  return { id };
}

module.exports = {
  create,
  findAll,
  findById,
  findByDate,
  update,
  remove,
};
