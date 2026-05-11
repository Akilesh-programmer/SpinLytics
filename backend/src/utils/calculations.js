/**
 * SpinLytics — Business Calculation Functions (2026 Standard)
 *
 * All derived values are computed dynamically, never stored.
 * These functions encapsulate the core business logic from the requirements.
 *
 * 2026 Standard adds: Production Kgs, Actual Production, Waste % (shift),
 * Worked Spindles, Grams per Spindle, Efficiency %
 */

const Decimal = require("decimal.js");

// Configure Decimal.js for precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ═══════════════════════════════════════════════════
// UNIT CONVERSION
// ═══════════════════════════════════════════════════

/**
 * Convert bags to kilograms
 * @param {number|string} bags
 * @returns {Decimal}
 */
function bagToKg(bags) {
  return new Decimal(bags).times(60);
}

// ═══════════════════════════════════════════════════
// 2026 STANDARD — SHIFT PRODUCTION FORMULAS
// ═══════════════════════════════════════════════════

/**
 * Formula 1: Production Kgs (Gross)
 * Production Kgs = Actual HK × STD Constant
 * @param {number|string} actualHK
 * @param {number|string} stdConstant
 * @returns {Decimal}
 */
function productionKgsGross(actualHK, stdConstant) {
  return new Decimal(actualHK).times(stdConstant);
}

/**
 * Formula 2: Actual Production Kgs (Net)
 * Actual Production = Production Kgs (Gross) − Waste Kgs
 * @param {number|string} grossKgs
 * @param {number|string} wasteKgs
 * @returns {Decimal}
 */
function actualProductionKgs(grossKgs, wasteKgs) {
  return new Decimal(grossKgs).minus(wasteKgs);
}

/**
 * Formula 3: Waste Percentage (%)
 * Waste % = (Waste Kgs / Production Kgs) × 100
 * Handles division by zero: returns 0 if Production Kgs is 0.
 * @param {number|string} wasteKgs
 * @param {number|string} grossKgs
 * @returns {Decimal}
 */
function wastePercentShift(wasteKgs, grossKgs) {
  const gross = new Decimal(grossKgs);
  if (gross.isZero()) return new Decimal(0);
  return new Decimal(wasteKgs).dividedBy(gross).times(100);
}

/**
 * Formula 4: Worked Spindles
 * Worked Spindles = (Total Spindles − Idle Spindles) × (Run Hrs / Shift Hours)
 * Example: (1728 − 0) × (11.4 / 12) = 1641.6
 * @param {number|string} totalSpindles
 * @param {number|string} idleSpindles
 * @param {number|string} runHrs
 * @param {number|string} shiftHours
 * @returns {Decimal}
 */
function workedSpindles(totalSpindles, idleSpindles, runHrs, shiftHours) {
  const shift = new Decimal(shiftHours);
  if (shift.isZero()) return new Decimal(0);
  return new Decimal(totalSpindles)
    .minus(idleSpindles)
    .times(new Decimal(runHrs).dividedBy(shift));
}

/**
 * Formula 5: Grams per Spindle
 * Grams per Spindle = (Actual Production × 1000) / Worked Spindles
 * 2026 Standard: Uses NET Actual Production (not Gross).
 * @param {number|string} netProductionKgs
 * @param {number|string} workedSpindlesVal
 * @returns {Decimal}
 */
function gramsPerSpindle(netProductionKgs, workedSpindlesVal) {
  const ws = new Decimal(workedSpindlesVal);
  if (ws.isZero()) return new Decimal(0);
  return new Decimal(netProductionKgs).times(1000).dividedBy(ws);
}

/**
 * Formula 6: Efficiency (%)
 * Efficiency % = (Actual HK / STD HK) × 100
 * @param {number|string} actualHK
 * @param {number|string} stdHK
 * @returns {Decimal}
 */
function efficiencyPercent(actualHK, stdHK) {
  const std = new Decimal(stdHK);
  if (std.isZero()) return new Decimal(0);
  return new Decimal(actualHK).dividedBy(std).times(100);
}

// ═══════════════════════════════════════════════════
// STOCK FORMULAS
// ═══════════════════════════════════════════════════

/**
 * EB Units consumed = Closing − Opening
 * @param {number|string} closingUnits
 * @param {number|string} openingUnits
 * @returns {Decimal}
 */
function ebUnitsConsumed(closingUnits, openingUnits) {
  return new Decimal(closingUnits).minus(openingUnits);
}

/**
 * Cotton Issue = Cotton + Fiber + Viscose + Excel (all raw materials issued)
 * @param {Object} materials - { cotton, fiber, viscose, excel } in kg
 * @returns {Decimal}
 */
function totalCottonIssue(materials) {
  const { cotton = 0, fiber = 0, viscose = 0, excel = 0 } = materials;
  return new Decimal(cotton).plus(fiber).plus(viscose).plus(excel);
}

// ═══════════════════════════════════════════════════
// MONTHLY / YEARLY REPORT FORMULAS
// ═══════════════════════════════════════════════════

/**
 * Yarn Realisation % = Total Production / Cotton Issue × 100
 * Measures the percentage of raw material successfully converted to yarn.
 * Together with Waste % and Invisible Loss %, the three values sum to 100%.
 * Example: 88% realisation + 4% waste + 8% invisible loss = 100%.
 * @param {number|string} cottonIssue
 * @param {number|string} totalProduction
 * @returns {Decimal}
 */
function yarnRealisationPercent(cottonIssue, totalProduction) {
  const issue = new Decimal(cottonIssue);
  if (issue.isZero()) return new Decimal(0);
  return new Decimal(totalProduction).dividedBy(issue).times(100);
}

/**
 * Waste % (Monthly) = Waste / Cotton Issue × 100
 * @param {number|string} wasteKg
 * @param {number|string} cottonIssue
 * @returns {Decimal}
 */
function wastePercent(wasteKg, cottonIssue) {
  const issue = new Decimal(cottonIssue);
  if (issue.isZero()) return new Decimal(0);
  return new Decimal(wasteKg).dividedBy(issue).times(100);
}

/**
 * Invisible Loss = 100 − Realisation% − Waste%
 * @param {number|string} realisationPct
 * @param {number|string} wastePct
 * @returns {Decimal}
 */
function invisibleLoss(realisationPct, wastePct) {
  return new Decimal(100).minus(realisationPct).minus(wastePct);
}

/**
 * UKG (Units per Kilogram) = EB Units / Production (kg)
 * Lower UKG = more energy efficient = BETTER
 * @param {number|string} ebUnits
 * @param {number|string} productionKg
 * @returns {Decimal}
 */
function ukg(ebUnits, productionKg) {
  const prod = new Decimal(productionKg);
  if (prod.isZero()) return new Decimal(0);
  return new Decimal(ebUnits).dividedBy(prod);
}

module.exports = {
  bagToKg,
  // 2026 Standard — Shift Production
  productionKgsGross,
  actualProductionKgs,
  wastePercentShift,
  workedSpindles,
  gramsPerSpindle,
  efficiencyPercent,
  // Stock / EB
  ebUnitsConsumed,
  totalCottonIssue,
  // Monthly / Yearly Reports
  yarnRealisationPercent,
  wastePercent,
  invisibleLoss,
  ukg,
};
