/**
 * System constants for SpinLytics
 */

// Conversion: 1 bag = 60 kg
const BAG_TO_KG = 60;

// Frame numbers used in production
const FRAME_NUMBERS = {
  FRAME_41: 'FRAME_41',
  FRAME_47: 'FRAME_47',
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
  FRAME_NUMBERS,
  MATERIAL_TYPES,
  TRANSACTION_TYPES,
  INFLOW_TYPES,
  OUTFLOW_TYPES,
  PACKING_SOURCES,
};
