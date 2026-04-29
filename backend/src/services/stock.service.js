const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { BAG_TO_KG, INFLOW_TYPES, OUTFLOW_TYPES } = require('../utils/constants');
const { bagToKg } = require('../utils/calculations');

/**
 * Create a new stock transaction
 */
async function create(data) {
  const kgs = bagToKg(data.bags).toNumber();
  const totalPrice = data.pricePerBag ? parseFloat((data.bags * data.pricePerBag).toFixed(2)) : null;

  // DISPATCH transactions must go through the Dispatch Entry (dispatch.service.js)
  // which atomically creates both a dispatch record and a stock transaction.
  if (data.transactionType === 'DISPATCH') {
    throw ApiError.badRequest(
      'DISPATCH transactions cannot be created directly. Use the Dispatch Entry instead.'
    );
  }

  // For outflow transactions (ISSUE), verify sufficient stock
  if (OUTFLOW_TYPES.includes(data.transactionType)) {
    const currentStock = await getCurrentStockForMaterial(data.materialType);
    if (currentStock < kgs) {
      throw ApiError.badRequest(
        `Insufficient stock for ${data.materialType}. Available: ${currentStock.toFixed(3)} kg, Requested: ${kgs.toFixed(3)} kg`
      );
    }
  }

  const transaction = await prisma.stockTransaction.create({
    data: {
      date: new Date(data.date),
      materialType: data.materialType,
      transactionType: data.transactionType,
      lotNo: data.lotNo,
      partyName: data.partyName,
      bags: data.bags,
      kgs,
      pricePerBag: data.pricePerBag || null,
      totalPrice,
      remarks: data.remarks || null,
    },
  });

  return transaction;
}

/**
 * Get all stock transactions with filters and pagination
 */
async function findAll(query) {
  const { startDate, endDate, materialType, transactionType, lotNo, partyName, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (materialType) where.materialType = materialType;
  if (transactionType) where.transactionType = transactionType;
  if (lotNo) where.lotNo = { contains: lotNo, mode: 'insensitive' };
  if (partyName) where.partyName = { contains: partyName, mode: 'insensitive' };

  const [transactions, total] = await Promise.all([
    prisma.stockTransaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.stockTransaction.count({ where }),
  ]);

  return {
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single stock transaction by ID
 */
async function findById(id) {
  const transaction = await prisma.stockTransaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw ApiError.notFound('Stock transaction not found');
  }

  return transaction;
}

/**
 * Update a stock transaction
 */
async function update(id, data) {
  const existing = await prisma.stockTransaction.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Stock transaction not found');
  }

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.materialType) updateData.materialType = data.materialType;
  if (data.transactionType) updateData.transactionType = data.transactionType;
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

  const transaction = await prisma.stockTransaction.update({
    where: { id },
    data: updateData,
  });

  return transaction;
}

/**
 * Delete a stock transaction
 */
async function remove(id) {
  const existing = await prisma.stockTransaction.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('Stock transaction not found');
  }

  await prisma.stockTransaction.delete({
    where: { id },
  });

  return { id };
}

/**
 * Get current stock for a specific material
 * Stock = SUM(PURCHASE + RETURN) - SUM(ISSUE + DISPATCH)
 */
async function getCurrentStockForMaterial(materialType) {
  const result = await prisma.stockTransaction.groupBy({
    by: ['transactionType'],
    where: { materialType },
    _sum: { kgs: true },
  });

  let stock = 0;
  for (const row of result) {
    const kgs = parseFloat(row._sum.kgs) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      stock += kgs;
    } else {
      stock -= kgs;
    }
  }

  return stock;
}

/**
 * Get current stock for all materials
 */
async function getCurrentStock() {
  const result = await prisma.stockTransaction.groupBy({
    by: ['materialType', 'transactionType'],
    _sum: { kgs: true },
  });

  const stockMap = {};
  for (const row of result) {
    if (!stockMap[row.materialType]) {
      stockMap[row.materialType] = 0;
    }
    const kgs = parseFloat(row._sum.kgs) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      stockMap[row.materialType] += kgs;
    } else {
      stockMap[row.materialType] -= kgs;
    }
  }

  return Object.entries(stockMap).map(([material, kgs]) => ({
    materialType: material,
    currentStockKg: parseFloat(kgs.toFixed(3)),
    currentStockBags: parseFloat((kgs / BAG_TO_KG).toFixed(2)),
  }));
}

/**
 * Get current stock for a specific material type
 */
async function getCurrentStockByMaterial(materialType) {
  const stock = await getCurrentStockForMaterial(materialType);
  return {
    materialType,
    currentStockKg: parseFloat(stock.toFixed(3)),
    currentStockBags: parseFloat((stock / BAG_TO_KG).toFixed(2)),
  };
}

/**
 * Get stock grouped by lot
 */
async function getLotWiseStock() {
  const result = await prisma.stockTransaction.groupBy({
    by: ['materialType', 'lotNo', 'transactionType'],
    _sum: { kgs: true, bags: true },
  });

  const lotMap = {};
  for (const row of result) {
    const key = `${row.materialType}::${row.lotNo}`;
    if (!lotMap[key]) {
      lotMap[key] = { materialType: row.materialType, lotNo: row.lotNo, kgs: 0, bags: 0 };
    }
    const kgs = parseFloat(row._sum.kgs) || 0;
    const bags = parseFloat(row._sum.bags) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      lotMap[key].kgs += kgs;
      lotMap[key].bags += bags;
    } else {
      lotMap[key].kgs -= kgs;
      lotMap[key].bags -= bags;
    }
  }

  return Object.values(lotMap)
    .filter((item) => item.kgs > 0)
    .map((item) => ({
      ...item,
      kgs: parseFloat(item.kgs.toFixed(3)),
      bags: parseFloat(item.bags.toFixed(2)),
    }));
}

/**
 * Get stock grouped by party
 */
async function getPartyWiseStock() {
  const result = await prisma.stockTransaction.groupBy({
    by: ['materialType', 'partyName', 'transactionType'],
    _sum: { kgs: true, bags: true },
  });

  const partyMap = {};
  for (const row of result) {
    const key = `${row.materialType}::${row.partyName}`;
    if (!partyMap[key]) {
      partyMap[key] = { materialType: row.materialType, partyName: row.partyName, kgs: 0, bags: 0 };
    }
    const kgs = parseFloat(row._sum.kgs) || 0;
    const bags = parseFloat(row._sum.bags) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      partyMap[key].kgs += kgs;
      partyMap[key].bags += bags;
    } else {
      partyMap[key].kgs -= kgs;
      partyMap[key].bags -= bags;
    }
  }

  return Object.values(partyMap)
    .map((item) => ({
      ...item,
      kgs: parseFloat(item.kgs.toFixed(3)),
      bags: parseFloat(item.bags.toFixed(2)),
    }));
}

/**
 * Get opening stock for a given date
 * Opening = all transactions BEFORE the given date
 */
async function getOpeningStock(date) {
  const result = await prisma.stockTransaction.groupBy({
    by: ['materialType', 'transactionType'],
    where: { date: { lt: new Date(date) } },
    _sum: { kgs: true },
  });

  const stockMap = {};
  for (const row of result) {
    if (!stockMap[row.materialType]) stockMap[row.materialType] = 0;
    const kgs = parseFloat(row._sum.kgs) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      stockMap[row.materialType] += kgs;
    } else {
      stockMap[row.materialType] -= kgs;
    }
  }

  return Object.entries(stockMap).map(([material, kgs]) => ({
    materialType: material,
    openingStockKg: parseFloat(kgs.toFixed(3)),
  }));
}

/**
 * Get closing stock for a given date
 * Closing = all transactions UP TO and INCLUDING the given date
 */
async function getClosingStock(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await prisma.stockTransaction.groupBy({
    by: ['materialType', 'transactionType'],
    where: { date: { lte: endOfDay } },
    _sum: { kgs: true },
  });

  const stockMap = {};
  for (const row of result) {
    if (!stockMap[row.materialType]) stockMap[row.materialType] = 0;
    const kgs = parseFloat(row._sum.kgs) || 0;
    if (INFLOW_TYPES.includes(row.transactionType)) {
      stockMap[row.materialType] += kgs;
    } else {
      stockMap[row.materialType] -= kgs;
    }
  }

  return Object.entries(stockMap).map(([material, kgs]) => ({
    materialType: material,
    closingStockKg: parseFloat(kgs.toFixed(3)),
  }));
}

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
  getCurrentStock,
  getCurrentStockByMaterial,
  getLotWiseStock,
  getPartyWiseStock,
  getOpeningStock,
  getClosingStock,
};
