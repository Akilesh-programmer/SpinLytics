const { z } = require('zod');

const createPackingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  source: z.enum(['AUTOCORNER', 'PRODUCTION'], {
    errorMap: () => ({ message: 'Source must be AUTOCORNER or PRODUCTION' }),
  }),
  yarnType: z.string().min(1, 'Yarn type is required').max(100),
  bags: z.number().positive('Bags must be positive'),
  lotNo: z.string().min(1, 'Lot number is required').max(100),
  remarks: z.string().max(500).optional().nullable(),
});

const updatePackingSchema = createPackingSchema.partial();

const packingQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(['AUTOCORNER', 'PRODUCTION']).optional(),
  lotNo: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

module.exports = {
  createPackingSchema,
  updatePackingSchema,
  packingQuerySchema,
  idParamSchema,
};
