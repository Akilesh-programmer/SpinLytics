const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { BAG_TO_KG, INFLOW_TYPES } = require('../utils/constants');
const { bagToKg } = require('../utils/calculations');
const stockService = require('./stock.service');

/**
 * Create a new dispatch entry
 * Dispatch reduces stock — also creates a DISPATCH stock transaction
 */
async function create(data) {
  const kgs = bagToKg(data.bags).toNumber();
  const totalPrice = data.pricePerBag ? parseFloat((data.bags * data.pricePerBag).toFixed(2)) : null;

  // Use Prisma transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Check sufficient stock
    const stockResult = await tx.stockTransaction.groupBy({
      by: ['transactionType'],
      where: { materialType: data.materialType },
      _sum: { kgs: true },
    });

    let currentStock = 0;
    for (const row of stockResult) {
      const rowKgs = parseFloat(row._sum.kgs) || 0;
      if (INFLOW_TYPES.includes(row.transactionType)) {
        currentStock += rowKgs;
      } else {
        currentStock -= rowKgs;
      }
    }

    if (currentStock < kgs) {
      throw ApiError.badRequest(
        `Insufficient stock for ${data.materialType}. Available: ${currentStock.toFixed(3)} kg, Requested: ${kgs.toFixed(3)} kg`
      );
    }

    // Create dispatch entry
    const dispatch = await tx.dispatchEntry.create({
      data: {
        date: new Date(data.date),
        materialType: data.materialType,
        lotNo: data.lotNo,
        partyName: data.partyName,
        bags: data.bags,
        kgs,
        pricePerBag: data.pricePerBag || null,
        totalPrice,
        remarks: data.remarks || null,
      },
    });

    // Create corresponding stock transaction (DISPATCH type)
    await tx.stockTransaction.create({
      data: {
        date: new Date(data.date),
        materialType: data.materialType,
        transactionType: 'DISPATCH',
        lotNo: data.lotNo,
        partyName: data.partyName,
        bags: data.bags,
        kgs,
        pricePerBag: data.pricePerBag || null,
        totalPrice,
        remarks: `Auto-created from dispatch ${dispatch.id}`,
      },
    });

    return dispatch;
  });

  return result;
}

/**
 * Get all dispatch entries with filters and pagination
 */
async function findAll(query) {
  const { startDate, endDate, materialType, lotNo, partyName, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (materialType) where.materialType = materialType;
  if (lotNo) where.lotNo = { contains: lotNo, mode: 'insensitive' };
  if (partyName) where.partyName = { contains: partyName, mode: 'insensitive' };

  const [entries, total] = await Promise.all([
    prisma.dispatchEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.dispatchEntry.count({ where }),
  ]);

  return {
    data: entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single dispatch entry by ID
 */
async function findById(id) {
  const entry = await prisma.dispatchEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw ApiError.notFound('Dispatch entry not found');
  }

  return entry;
}

/**
 * Update a dispatch entry
 */
async function update(id, data) {
  const existing = await prisma.dispatchEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Dispatch entry not found');
  }

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.materialType) updateData.materialType = data.materialType;
  if (data.lotNo) updateData.lotNo = data.lotNo;
  if (data.partyName) updateData.partyName = data.partyName;
  if (data.bags !== undefined) {
    updateData.bags = data.bags;
    updateData.kgs = bagToKg(data.bags).toNumber();
  }
  if (data.pricePerBag !== undefined) {
    updateData.pricePerBag = data.pricePerBag;
    const bags = data.bags !== undefined ? data.bags : parseFloat(existing.bags);
    updateData.totalPrice = data.pricePerBag ? parseFloat((bags * data.pricePerBag).toFixed(2)) : null;
  }
  if (data.remarks !== undefined) updateData.remarks = data.remarks;

  const entry = await prisma.dispatchEntry.update({
    where: { id },
    data: updateData,
  });

  return entry;
}

/**
 * Delete a dispatch entry
 */
async function remove(id) {
  const existing = await prisma.dispatchEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Dispatch entry not found');
  }

  await prisma.dispatchEntry.delete({
    where: { id },
  });

  return { id };
}

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
