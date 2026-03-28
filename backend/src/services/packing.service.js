const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { bagToKg } = require('../utils/calculations');

/**
 * Create a new packing entry
 * Packing bridges production and stock — it feeds into stock and loss calculations
 */
async function create(data) {
  const kgs = bagToKg(data.bags).toNumber();

  const entry = await prisma.packingEntry.create({
    data: {
      date: new Date(data.date),
      source: data.source,
      yarnType: data.yarnType,
      bags: data.bags,
      kgs,
      lotNo: data.lotNo,
      remarks: data.remarks || null,
    },
  });

  return entry;
}

/**
 * Get all packing entries with filters and pagination
 */
async function findAll(query) {
  const { startDate, endDate, source, lotNo, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (source) where.source = source;
  if (lotNo) where.lotNo = { contains: lotNo, mode: 'insensitive' };

  const [entries, total] = await Promise.all([
    prisma.packingEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.packingEntry.count({ where }),
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
 * Get a single packing entry by ID
 */
async function findById(id) {
  const entry = await prisma.packingEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw ApiError.notFound('Packing entry not found');
  }

  return entry;
}

/**
 * Update a packing entry
 */
async function update(id, data) {
  const existing = await prisma.packingEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Packing entry not found');
  }

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.source) updateData.source = data.source;
  if (data.yarnType) updateData.yarnType = data.yarnType;
  if (data.bags !== undefined) {
    updateData.bags = data.bags;
    updateData.kgs = bagToKg(data.bags).toNumber();
  }
  if (data.lotNo) updateData.lotNo = data.lotNo;
  if (data.remarks !== undefined) updateData.remarks = data.remarks;

  const entry = await prisma.packingEntry.update({
    where: { id },
    data: updateData,
  });

  return entry;
}

/**
 * Delete a packing entry
 */
async function remove(id) {
  const existing = await prisma.packingEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Packing entry not found');
  }

  await prisma.packingEntry.delete({
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
