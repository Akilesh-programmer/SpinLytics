const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const { ebUnitsConsumed } = require('../utils/calculations');

/**
 * Create a new EB entry
 */
async function create(data) {
  // Check for duplicate (month + year)
  const existing = await prisma.eBEntry.findUnique({
    where: {
      month_year: {
        month: data.month,
        year: data.year,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict(
      `EB entry already exists for ${data.month}/${data.year}`
    );
  }

  const entry = await prisma.eBEntry.create({
    data: {
      month: data.month,
      year: data.year,
      openingUnits: data.openingUnits,
      closingUnits: data.closingUnits,
    },
  });

  return enrichWithCalculations(entry);
}

/**
 * Get all EB entries with filters and pagination
 */
async function findAll(query) {
  const { year, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (year) where.year = year;

  const [entries, total] = await Promise.all([
    prisma.eBEntry.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.eBEntry.count({ where }),
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
 * Get a single EB entry by ID
 */
async function findById(id) {
  const entry = await prisma.eBEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    throw ApiError.notFound('EB entry not found');
  }

  return enrichWithCalculations(entry);
}

/**
 * Get EB entry for a specific month/year
 */
async function findByMonthYear(month, year) {
  const entry = await prisma.eBEntry.findUnique({
    where: {
      month_year: { month, year },
    },
  });

  if (!entry) {
    throw ApiError.notFound(`EB entry not found for ${month}/${year}`);
  }

  return enrichWithCalculations(entry);
}

/**
 * Get the closing units from the previous month's EB entry.
 * Used to auto-populate opening units for the current month.
 */
async function getPreviousClosing(month, year) {
  // Calculate the previous month (handle Jan → Dec rollback)
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const entry = await prisma.eBEntry.findUnique({
    where: {
      month_year: { month: prevMonth, year: prevYear },
    },
  });

  if (!entry) {
    return { found: false, previousMonth: prevMonth, previousYear: prevYear, closingUnits: null };
  }

  return {
    found: true,
    previousMonth: prevMonth,
    previousYear: prevYear,
    closingUnits: parseFloat(entry.closingUnits),
  };
}

/**
 * Update an EB entry
 */
async function update(id, data) {
  const existing = await prisma.eBEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('EB entry not found');
  }

  // If changing month or year, check for conflicts
  if (data.month !== undefined || data.year !== undefined) {
    const newMonth = data.month !== undefined ? data.month : existing.month;
    const newYear = data.year !== undefined ? data.year : existing.year;

    const conflict = await prisma.eBEntry.findFirst({
      where: {
        month: newMonth,
        year: newYear,
        NOT: { id },
      },
    });

    if (conflict) {
      throw ApiError.conflict(
        `EB entry already exists for ${newMonth}/${newYear}`
      );
    }
  }

  const updateData = {};
  if (data.month !== undefined) updateData.month = data.month;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.openingUnits !== undefined) updateData.openingUnits = data.openingUnits;
  if (data.closingUnits !== undefined) updateData.closingUnits = data.closingUnits;

  const entry = await prisma.eBEntry.update({
    where: { id },
    data: updateData,
  });

  return enrichWithCalculations(entry);
}

/**
 * Delete an EB entry
 */
async function remove(id) {
  const existing = await prisma.eBEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound('EB entry not found');
  }

  await prisma.eBEntry.delete({
    where: { id },
  });

  return { id };
}

/**
 * Enrich EB entry with computed EB units
 */
function enrichWithCalculations(entry) {
  const opening = parseFloat(entry.openingUnits);
  const closing = parseFloat(entry.closingUnits);

  return {
    ...entry,
    calculated: {
      ebUnitsConsumed: ebUnitsConsumed(closing, opening).toFixed(3),
    },
  };
}

module.exports = {
  create,
  findAll,
  findById,
  findByMonthYear,
  getPreviousClosing,
  update,
  remove,
};
