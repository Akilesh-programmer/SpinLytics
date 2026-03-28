const { z } = require('zod');

const createDispatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  materialType: z.enum(['COTTON', 'VISCOSE', 'FIBER', 'EXCEL', 'YARN', 'WASTE'], {
    errorMap: () => ({ message: 'Invalid material type' }),
  }),
  lotNo: z.string().min(1, 'Lot number is required').max(100),
  partyName: z.string().min(1, 'Party name is required').max(200),
  bags: z.number().positive('Bags must be positive'),
  pricePerBag: z.number().min(0).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

const updateDispatchSchema = createDispatchSchema.partial();

const dispatchQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  materialType: z.enum(['COTTON', 'VISCOSE', 'FIBER', 'EXCEL', 'YARN', 'WASTE']).optional(),
  lotNo: z.string().optional(),
  partyName: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

module.exports = {
  createDispatchSchema,
  updateDispatchSchema,
  dispatchQuerySchema,
  idParamSchema,
};
