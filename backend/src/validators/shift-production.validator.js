const { z } = require("zod");

// Single row schema
const shiftProductionRowSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  shiftHours: z.number().positive("Shift hours must be positive"),
  totalSpindlesPerMachine: z
    .number()
    .int()
    .positive("Total spindles must be a positive integer"),
  rfNo: z.string().min(1, "R/F No is required").max(50),
  siderName: z.string().min(1, "Sider Name is required").max(200),
  count: z.string().min(1, "Count is required").max(50),
  stdConstant: z.number().positive("STD Constant must be positive"),
  stdHK: z.number().positive("STD HK must be positive"),
  actualHK: z.number().min(0, "Actual HK cannot be negative"),
  runHrs: z.number().min(0, "Run Hours cannot be negative"),
  idleSpindles: z
    .number()
    .int()
    .min(0, "Idle Spindles cannot be negative")
    .default(0),
  wasteKgs: z.number().min(0, "Waste Kgs cannot be negative"),
  autocornerKg: z.number().min(0, "Autocorner Kg cannot be negative").optional().nullable(),
  stoppages: z.string().max(500).optional().nullable(),
});

// Batch schema — session settings + array of rows
const createShiftProductionBatchSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  shiftHours: z.number().positive("Shift hours must be positive"),
  totalSpindlesPerMachine: z
    .number()
    .int()
    .positive("Total spindles must be a positive integer"),
  rows: z
    .array(
      z.object({
        rfNo: z.string().min(1, "R/F No is required").max(50),
        siderName: z.string().min(1, "Sider Name is required").max(200),
        count: z.string().min(1, "Count is required").max(50),
        stdConstant: z.number().positive("STD Constant must be positive"),
        stdHK: z.number().positive("STD HK must be positive"),
        actualHK: z.number().min(0, "Actual HK cannot be negative"),
        runHrs: z.number().min(0, "Run Hours cannot be negative"),
        idleSpindles: z
          .number()
          .int()
          .min(0, "Idle Spindles cannot be negative")
          .default(0),
        wasteKgs: z.number().min(0, "Waste Kgs cannot be negative"),
        autocornerKg: z.number().min(0, "Autocorner Kg cannot be negative").optional().nullable(),
        stoppages: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1, "At least one row is required"),
});

// Update schema (partial)
const updateShiftProductionSchema = shiftProductionRowSchema.partial();

// Query filters
const shiftProductionQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  rfNo: z.string().optional(),
  count: z.string().optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(500))
    .optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

const dateParamSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

module.exports = {
  shiftProductionRowSchema,
  createShiftProductionBatchSchema,
  updateShiftProductionSchema,
  shiftProductionQuerySchema,
  idParamSchema,
  dateParamSchema,
};
