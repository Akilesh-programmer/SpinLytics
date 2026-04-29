/**
 * SpinLytics — Business Calculation Functions
 *
 * All derived values are computed dynamically, never stored.
 * These functions encapsulate the core business logic from the requirements.
 */

const Decimal = require('decimal.js');

// Configure Decimal.js for precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Convert bags to kilograms
 * @param {number|string} bags
 * @returns {Decimal}
 */
function bagToKg(bags) {
  return new Decimal(bags).times(60);
}

/**
 * Spinning Loss = Production - Autocorner
 * @param {number|string} productionKg
 * @param {number|string} autocornerKg
 * @returns {Decimal}
 */
function spinningLoss(productionKg, autocornerKg) {
  return new Decimal(productionKg).minus(autocornerKg);
}

/**
 * Spinning Loss % = (Production - Autocorner) / Production × 100
 * @param {number|string} productionKg
 * @param {number|string} autocornerKg
 * @returns {Decimal}
 */
function spinningLossPercent(productionKg, autocornerKg) {
  const prod = new Decimal(productionKg);
  if (prod.isZero()) return new Decimal(0);
  return spinningLoss(productionKg, autocornerKg).dividedBy(prod).times(100);
}

/**
 * Autocorner Loss = Autocorner - Packing
 * @param {number|string} autocornerKg
 * @param {number|string} packingKg
 * @returns {Decimal}
 */
function autocornerLoss(autocornerKg, packingKg) {
  return new Decimal(autocornerKg).minus(packingKg);
}

/**
 * Autocorner Loss % = (Autocorner - Packing) / Autocorner × 100
 * @param {number|string} autocornerKg
 * @param {number|string} packingKg
 * @returns {Decimal}
 */
function autocornerLossPercent(autocornerKg, packingKg) {
  const auto = new Decimal(autocornerKg);
  if (auto.isZero()) return new Decimal(0);
  return autocornerLoss(autocornerKg, packingKg).dividedBy(auto).times(100);
}

/**
 * UKG (Energy Efficiency) = EB Units / Production
 * @param {number|string} ebUnits
 * @param {number|string} productionKg
 * @returns {Decimal}
 */
function ukg(ebUnits, productionKg) {
  const prod = new Decimal(productionKg);
  if (prod.isZero()) return new Decimal(0);
  return new Decimal(ebUnits).dividedBy(prod);
}

/**
 * GPS (Gram per Spindle) = Production / Spindles
 * @param {number|string} productionKg
 * @param {number|string} spindles
 * @returns {Decimal}
 */
function gps(productionKg, spindles) {
  const sp = new Decimal(spindles);
  if (sp.isZero()) return new Decimal(0);
  return new Decimal(productionKg).dividedBy(sp);
}

/**
 * EB Units consumed = Closing - Opening
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
  return new Decimal(cotton)
    .plus(fiber)
    .plus(viscose)
    .plus(excel);
}

/**
 * Yarn Realisation % = (Cotton Issue - Production) / Cotton Issue × 100
 * Per Requirements.MD: measures the percentage of raw material NOT converted to yarn
 * @param {number|string} cottonIssue
 * @param {number|string} totalProduction
 * @returns {Decimal}
 */
function yarnRealisationPercent(cottonIssue, totalProduction) {
  const issue = new Decimal(cottonIssue);
  if (issue.isZero()) return new Decimal(0);
  return issue.minus(totalProduction).dividedBy(issue).times(100);
}

/**
 * Waste % = Waste / Cotton Issue × 100
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
 * Invisible Loss = 100 - Realisation% - Waste%
 * @param {number|string} realisationPct
 * @param {number|string} wastePct
 * @returns {Decimal}
 */
function invisibleLoss(realisationPct, wastePct) {
  return new Decimal(100).minus(realisationPct).minus(wastePct);
}

module.exports = {
  bagToKg,
  spinningLoss,
  spinningLossPercent,
  autocornerLoss,
  autocornerLossPercent,
  ukg,
  gps,
  ebUnitsConsumed,
  totalCottonIssue,
  yarnRealisationPercent,
  wastePercent,
  invisibleLoss,
};
