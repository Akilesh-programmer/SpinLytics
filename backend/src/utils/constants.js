/**
 * System constants for SpinLytics (2026 Standard)
 */

// Conversion: 1 bag = 60 kg
const BAG_TO_KG = 60;

// Common Total Spindles per Machine values
const SPINDLE_PRESETS = {
  STANDARD: 1152,
  LARGE: 1728,
};

// Common Shift Hours
const SHIFT_PRESETS = {
  SHORT: 8,
  LONG: 12,
};

// Material types
const MATERIAL_TYPES = {
  COTTON: 'COTTON',
  VISCOSE: 'VISCOSE',
  FIBER: 'FIBER',
  EXCEL: 'EXCEL',
  YARN: 'YARN',
  WASTE: 'WASTE',
};

// Raw material types (used for Cotton Issue calculation)
const RAW_MATERIAL_TYPES = ['COTTON', 'VISCOSE', 'FIBER', 'EXCEL'];

// Transaction types
const TRANSACTION_TYPES = {
  PURCHASE: 'PURCHASE',
  ISSUE: 'ISSUE',
  DISPATCH: 'DISPATCH',
  RETURN: 'RETURN',
};

// Inflow transaction types (increase stock)
const INFLOW_TYPES = ['PURCHASE', 'RETURN'];

// Outflow transaction types (decrease stock)
const OUTFLOW_TYPES = ['ISSUE', 'DISPATCH'];

// Packing sources
const PACKING_SOURCES = {
  AUTOCORNER: 'AUTOCORNER',
  PRODUCTION: 'PRODUCTION',
};

module.exports = {
  BAG_TO_KG,
  SPINDLE_PRESETS,
  SHIFT_PRESETS,
  MATERIAL_TYPES,
  RAW_MATERIAL_TYPES,
  TRANSACTION_TYPES,
  INFLOW_TYPES,
  OUTFLOW_TYPES,
  PACKING_SOURCES,
};
