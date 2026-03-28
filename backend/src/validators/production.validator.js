const { z } = require('zod');

const baseProductionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  frameNumber: z.enum(['FRAME_41', 'FRAME_47'], {
    errorMap: () => ({ message: 'Frame must be FRAME_41 or FRAME_47' }),
  }),
  productionKg: z.number().positive('Production must be positive'),
  autocornerProductionKg: z.number().positive('Autocorner production must be positive'),
  packingKg: z.number().min(0, 'Packing cannot be negative'),
  ebUnits: z.number().min(0, 'EB units cannot be negative'),
  noOfSpindles: z.number().int().positive('Spindles must be a positive integer'),
  remarks: z.string().max(500).optional().nullable(),
});

const createProductionSchema = baseProductionSchema.refine(
  (data) => data.autocornerProductionKg <= data.productionKg,
  { message: 'Autocorner production cannot exceed total production', path: ['autocornerProductionKg'] }
).refine(
  (data) => data.packingKg <= data.autocornerProductionKg,
  { message: 'Packing cannot exceed autocorner production', path: ['packingKg'] }
);

const updateProductionSchema = baseProductionSchema.partial();

const productionQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  frameNumber: z.enum(['FRAME_41', 'FRAME_47']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

module.exports = {
  createProductionSchema,
  updateProductionSchema,
  productionQuerySchema,
  idParamSchema,
  dateParamSchema,
};
