const { z } = require('zod');

const baseEBSchema = z.object({
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2000).max(2100, 'Year must be between 2000 and 2100'),
  openingUnits: z.number().min(0, 'Opening units cannot be negative'),
  closingUnits: z.number().min(0, 'Closing units cannot be negative'),
});

const createEBSchema = baseEBSchema.refine(
  (data) => data.closingUnits >= data.openingUnits,
  { message: 'Closing units must be greater than or equal to opening units', path: ['closingUnits'] }
);

const updateEBSchema = baseEBSchema.partial();

const ebQuerySchema = z.object({
  year: z.string().transform(Number).pipe(z.number().int().min(2000).max(2100)).optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const monthYearParamSchema = z.object({
  year: z.string().transform(Number).pipe(z.number().int().min(2000).max(2100)),
  month: z.string().transform(Number).pipe(z.number().int().min(1).max(12)),
});

module.exports = {
  createEBSchema,
  updateEBSchema,
  ebQuerySchema,
  idParamSchema,
  monthYearParamSchema,
};
