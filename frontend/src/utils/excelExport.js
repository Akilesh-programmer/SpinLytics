import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

// ─── Color Palette ─────────────────────────────────────────
const C = {
  teal:     '00D4AA',
  tealDark: '0A1A2F',
  navy:     '0F2A3F',
  blue:     '3B82F6',
  purple:   '8B5CF6',
  amber:    'F59E0B',
  red:      'EF4444',
  green:    '10B981',
  cyan:     '06B6D4',
  white:    'FFFFFF',
  light:    'F1F5F9',
  gray:     'E2E8F0',
  darkGray: '64748B',
};

// ─── Style Presets ──────────────────────────────────────────
const S = {
  title: {
    font: { bold: true, sz: 16, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.tealDark } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.tealDark),
  },
  subtitle: {
    font: { bold: true, sz: 12, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.navy),
  },
  header: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.teal } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.teal),
  },
  headerBlue: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.blue } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.blue),
  },
  headerPurple: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.purple } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.purple),
  },
  headerAmber: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.amber } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.amber),
  },
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: C.tealDark } },
    fill: { fgColor: { rgb: C.light } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderAll(C.gray),
  },
  cell: {
    font: { sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.gray),
  },
  cellLeft: {
    font: { sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderAll(C.gray),
  },
  cellBold: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.gray),
  },
  totalRow: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.navy),
  },
  highlight: {
    font: { bold: true, sz: 10, color: { rgb: C.tealDark } },
    fill: { fgColor: { rgb: 'CCFBF1' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.gray),
  },
  warning: {
    font: { bold: true, sz: 10, color: { rgb: C.red } },
    fill: { fgColor: { rgb: 'FEF2F2' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderAll(C.gray),
  },
};

function borderAll(color) {
  const b = { style: 'thin', color: { rgb: color || C.gray } };
  return { top: b, bottom: b, left: b, right: b };
}

// ─── Helpers ────────────────────────────────────────────────
function n(v) { return v != null ? Number(v) : 0; }
function f(v, d = 3) { return n(v).toFixed(d); }

function createWorkbook() { return XLSX.utils.book_new(); }

function addSheet(wb, data, name, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet(data.map(r => r.map(c => c?.v !== undefined ? c : c)));
  // Apply styles
  data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (cell && typeof cell === 'object' && cell.v !== undefined) {
        ws[addr] = { v: cell.v, t: cell.t || (typeof cell.v === 'number' ? 'n' : 's'), s: cell.s };
      }
    });
  });
  if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));

  // Detect merges from data
  if (data._merges) ws['!merges'] = data._merges;

  XLSX.utils.book_append_sheet(wb, ws, name);
  return ws;
}

function sc(value, style) { return { v: value, s: style, t: typeof value === 'number' ? 'n' : 's' }; }
function empty() { return sc('', S.cell); }

function download(wb, filename) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), filename);
}

// ─────────────────────────────────────────────────────────────
// REPORT 1: Daily Production Report
// ─────────────────────────────────────────────────────────────
export function exportDailyProduction(data, dateStr) {
  const wb = createWorkbook();
  const { frames = [], totals } = data || {};
  const rows = [];

  // Title
  rows.push([sc('SPINLYTICS — DAILY PRODUCTION REPORT', S.title), ...Array(8).fill(sc('', S.title))]);
  rows.push([sc(`Date: ${dateStr}`, S.subtitle), ...Array(8).fill(sc('', S.subtitle))]);
  rows.push(Array(9).fill(empty()));

  // Headers
  rows.push([
    sc('Frame', S.header), sc('Production (kg)', S.header), sc('Autocorner (kg)', S.header),
    sc('Packing (kg)', S.header), sc('EB Units', S.header), sc('Spindles', S.header),
    sc('Spinning Loss %', S.headerBlue), sc('Autocorner Loss %', S.headerPurple),
    sc('GPS', S.headerAmber),
  ]);

  // Frame rows
  frames.forEach(fr => {
    const c = fr.calculated || {};
    rows.push([
      sc(fr.frameNumber === 'FRAME_41' ? 'Frame 41' : 'Frame 47', S.cellLeft),
      sc(n(fr.productionKg), S.cell), sc(n(fr.autocornerProductionKg), S.cell),
      sc(n(fr.packingKg), S.cell), sc(n(fr.ebUnits), S.cell), sc(fr.noOfSpindles, S.cell),
      sc(n(c.spinningLossPercent), S.cell), sc(n(c.autocornerLossPercent), S.cell),
      sc(n(c.gps), S.cell),
    ]);
  });

  // Totals
  if (totals) {
    rows.push([
      sc('TOTAL', S.totalRow), sc(n(totals.totalProductionKg), S.totalRow),
      sc(n(totals.totalAutocornerKg), S.totalRow), sc(n(totals.totalPackingKg), S.totalRow),
      sc(n(totals.totalEBUnits), S.totalRow), sc(totals.totalSpindles, S.totalRow),
      sc(n(totals.spinningLossPercent), S.totalRow), sc(n(totals.autocornerLossPercent), S.totalRow),
      sc(n(totals.gps), S.totalRow),
    ]);

    rows.push(Array(9).fill(empty()));
    rows.push([sc('KEY METRICS', S.sectionHeader), ...Array(8).fill(sc('', S.sectionHeader))]);
    rows.push([sc('UKG', S.cellBold), sc(n(totals.ukg), S.highlight), empty(), sc('GPS', S.cellBold), sc(n(totals.gps), S.highlight), ...Array(4).fill(empty())]);
    rows.push([sc('Spinning Loss %', S.cellBold), sc(n(totals.spinningLossPercent), n(totals.spinningLossPercent) > 5 ? S.warning : S.highlight), empty(), sc('Autocorner Loss %', S.cellBold), sc(n(totals.autocornerLossPercent), n(totals.autocornerLossPercent) > 5 ? S.warning : S.highlight), ...Array(4).fill(empty())]);
  }

  // Remarks
  const remarks = frames.filter(fr => fr.remarks).map(fr => `${fr.frameNumber}: ${fr.remarks}`).join('; ');
  if (remarks) {
    rows.push(Array(9).fill(empty()));
    rows.push([sc('REMARKS', S.sectionHeader), ...Array(8).fill(sc('', S.sectionHeader))]);
    rows.push([sc(remarks, S.cellLeft), ...Array(8).fill(empty())]);
  }

  addSheet(wb, rows, 'Daily Production', [14, 16, 16, 14, 12, 12, 16, 18, 10]);
  download(wb, `SpinLytics_Daily_Production_${dateStr}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 2: Monthly Realisation Report
// ─────────────────────────────────────────────────────────────
export function exportMonthlyRealisation(data) {
  const wb = createWorkbook();
  const rows = [];
  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  rows.push([sc('SPINLYTICS — MONTHLY REALISATION REPORT', S.title), ...Array(5).fill(sc('', S.title))]);
  rows.push([sc(`${MONTHS[data.month]} ${data.year}`, S.subtitle), ...Array(5).fill(sc('', S.subtitle))]);
  rows.push(Array(6).fill(empty()));

  // Production Section
  rows.push([sc('PRODUCTION', S.sectionHeader), ...Array(5).fill(sc('', S.sectionHeader))]);
  rows.push([sc('Metric', S.header), sc('Frame 41', S.header), sc('Frame 47', S.header), sc('Total', S.header), sc('Unit', S.header), sc('Days', S.header)]);
  rows.push([
    sc('Spinning Production', S.cellLeft), sc(n(data.production?.frame41Kg), S.cell),
    sc(n(data.production?.frame47Kg), S.cell), sc(n(data.production?.totalProductionKg), S.cellBold),
    sc('kg', S.cell), sc(data.production?.daysRecorded || 0, S.cell),
  ]);
  rows.push([
    sc('Autocorner Production', S.cellLeft), sc('—', S.cell), sc('—', S.cell),
    sc(n(data.production?.totalAutocornerKg), S.cellBold), sc('kg', S.cell), empty(),
  ]);
  rows.push([
    sc('Packing', S.cellLeft), sc('—', S.cell), sc('—', S.cell),
    sc(n(data.production?.totalPackingKg), S.cellBold), sc('kg', S.cell), empty(),
  ]);

  rows.push(Array(6).fill(empty()));

  // Loss Section
  rows.push([sc('LOSS ANALYSIS', S.sectionHeader), ...Array(5).fill(sc('', S.sectionHeader))]);
  rows.push([sc('Metric', S.header), sc('Value', S.header), sc('Status', S.header), ...Array(3).fill(sc('', S.header))]);
  const slp = n(data.production?.spinningLossPercent);
  const alp = n(data.production?.autocornerLossPercent);
  rows.push([sc('Spinning Loss %', S.cellLeft), sc(slp, slp > 5 ? S.warning : S.highlight), sc(slp > 5 ? '⚠ HIGH' : '✓ OK', slp > 5 ? S.warning : S.highlight), ...Array(3).fill(empty())]);
  rows.push([sc('Autocorner Loss %', S.cellLeft), sc(alp, alp > 5 ? S.warning : S.highlight), sc(alp > 5 ? '⚠ HIGH' : '✓ OK', alp > 5 ? S.warning : S.highlight), ...Array(3).fill(empty())]);

  rows.push(Array(6).fill(empty()));

  // Raw Materials Section
  rows.push([sc('RAW MATERIAL ISSUE', S.sectionHeader), ...Array(5).fill(sc('', S.sectionHeader))]);
  rows.push([sc('Material', S.header), sc('Issue (kg)', S.header), ...Array(4).fill(sc('', S.header))]);
  rows.push([sc('Cotton', S.cellLeft), sc(n(data.rawMaterials?.cottonIssueKg), S.cell), ...Array(4).fill(empty())]);
  rows.push([sc('Fiber', S.cellLeft), sc(n(data.rawMaterials?.fiberIssueKg), S.cell), ...Array(4).fill(empty())]);
  rows.push([sc('Viscose', S.cellLeft), sc(n(data.rawMaterials?.viscoseIssueKg), S.cell), ...Array(4).fill(empty())]);
  rows.push([sc('Excel', S.cellLeft), sc(n(data.rawMaterials?.excelIssueKg), S.cell), ...Array(4).fill(empty())]);
  rows.push([sc('TOTAL COTTON ISSUE', S.totalRow), sc(n(data.rawMaterials?.totalCottonIssueKg), S.totalRow), ...Array(4).fill(sc('', S.totalRow))]);

  rows.push(Array(6).fill(empty()));

  // Key Metrics
  rows.push([sc('KEY METRICS', S.sectionHeader), ...Array(5).fill(sc('', S.sectionHeader))]);
  rows.push([sc('Metric', S.header), sc('Value', S.header), sc('Unit', S.header), ...Array(3).fill(sc('', S.header))]);
  rows.push([sc('Yarn Realisation', S.cellLeft), sc(n(data.metrics?.yarnRealisationPercent), S.highlight), sc('%', S.cell), ...Array(3).fill(empty())]);
  rows.push([sc('Waste', S.cellLeft), sc(n(data.metrics?.wastePercent), S.cell), sc('%', S.cell), ...Array(3).fill(empty())]);
  rows.push([sc('Invisible Loss', S.cellLeft), sc(n(data.metrics?.invisibleLossPercent), n(data.metrics?.invisibleLossPercent) > 3 ? S.warning : S.cell), sc('%', S.cell), ...Array(3).fill(empty())]);
  rows.push([sc('Total Waste', S.cellLeft), sc(n(data.metrics?.totalWasteKg), S.cell), sc('kg', S.cell), ...Array(3).fill(empty())]);

  rows.push(Array(6).fill(empty()));

  // Energy Section
  rows.push([sc('ENERGY', S.sectionHeader), ...Array(5).fill(sc('', S.sectionHeader))]);
  rows.push([sc('EB Units Consumed', S.cellLeft), sc(n(data.energy?.ebUnitsConsumed), S.cell), ...Array(4).fill(empty())]);
  rows.push([sc('UKG', S.cellLeft), sc(n(data.energy?.ukg), S.highlight), ...Array(4).fill(empty())]);

  addSheet(wb, rows, 'Monthly Realisation', [22, 16, 14, 14, 10, 10]);
  download(wb, `SpinLytics_Monthly_${MONTHS[data.month]}_${data.year}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 3: Stock Report (Lot-wise)
// ─────────────────────────────────────────────────────────────
export function exportStockReport(data) {
  const wb = createWorkbook();
  const rows = [];
  const { currentStock = [], lotWise = [], recentTransactions = [] } = data || {};

  rows.push([sc('SPINLYTICS — STOCK REPORT', S.title), ...Array(7).fill(sc('', S.title))]);
  rows.push([sc(`Generated: ${new Date().toLocaleDateString('en-IN')}`, S.subtitle), ...Array(7).fill(sc('', S.subtitle))]);
  rows.push(Array(8).fill(empty()));

  // Current Stock Summary
  rows.push([sc('CURRENT STOCK SUMMARY', S.sectionHeader), ...Array(7).fill(sc('', S.sectionHeader))]);
  rows.push([sc('Material', S.header), sc('Stock (Bags)', S.header), sc('Stock (kg)', S.header), ...Array(5).fill(sc('', S.header))]);
  currentStock.forEach(s => {
    rows.push([sc(s.materialType, S.cellLeft), sc(n(s.currentStockBags), S.cell), sc(n(s.currentStockKg), S.cellBold), ...Array(5).fill(empty())]);
  });

  rows.push(Array(8).fill(empty()));

  // Lot-wise Stock
  rows.push([sc('LOT-WISE STOCK', S.sectionHeader), ...Array(7).fill(sc('', S.sectionHeader))]);
  rows.push([sc('Material', S.header), sc('Lot No', S.header), sc('Stock (kg)', S.header), ...Array(5).fill(sc('', S.header))]);
  lotWise.sort((a, b) => a.materialType.localeCompare(b.materialType)).forEach(item => {
    rows.push([sc(item.materialType, S.cellLeft), sc(item.lotNo, S.cellLeft), sc(n(item.kgs), S.cell), ...Array(5).fill(empty())]);
  });

  rows.push(Array(8).fill(empty()));

  // Recent Transactions
  rows.push([sc('RECENT TRANSACTIONS', S.sectionHeader), ...Array(7).fill(sc('', S.sectionHeader))]);
  rows.push([
    sc('Date', S.header), sc('Material', S.header), sc('Type', S.header),
    sc('Lot No', S.header), sc('Party', S.header), sc('Bags', S.header),
    sc('KG', S.header), sc('Remarks', S.header),
  ]);
  recentTransactions.forEach(txn => {
    const typeStyle = ['PURCHASE', 'RETURN'].includes(txn.transactionType) ? S.highlight : S.cell;
    rows.push([
      sc(new Date(txn.date).toLocaleDateString('en-IN'), S.cell),
      sc(txn.materialType, S.cellLeft), sc(txn.transactionType, typeStyle),
      sc(txn.lotNo, S.cellLeft), sc(txn.partyName, S.cellLeft),
      sc(n(txn.bags), S.cell), sc(n(txn.kgs), S.cell),
      sc(txn.remarks || '', S.cellLeft),
    ]);
  });

  addSheet(wb, rows, 'Stock Report', [14, 14, 14, 14, 20, 12, 12, 20]);
  download(wb, `SpinLytics_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 4: Yearly Summary Report
// ─────────────────────────────────────────────────────────────
export function exportYearlySummary(data) {
  const wb = createWorkbook();
  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rows = [];

  rows.push([sc(`SPINLYTICS — YEARLY REPORT ${data.year}`, S.title), ...Array(8).fill(sc('', S.title))]);
  rows.push(Array(9).fill(empty()));

  // Production Summary
  rows.push([sc('MONTHLY PRODUCTION SUMMARY', S.sectionHeader), ...Array(8).fill(sc('', S.sectionHeader))]);
  rows.push([
    sc('Month', S.header), sc('Frame 41 (kg)', S.header), sc('Frame 47 (kg)', S.header),
    sc('Total (kg)', S.header), sc('Spinning Loss %', S.headerBlue),
    sc('Autocorner Loss %', S.headerPurple), sc('Yarn Realisation %', S.header),
    sc('Waste %', S.headerAmber), sc('UKG', S.header),
  ]);

  let yearTotalProd = 0;
  (data.months || []).forEach(m => {
    const prod = n(m.production?.totalProductionKg);
    yearTotalProd += prod;
    if (prod === 0) return; // Skip empty months
    rows.push([
      sc(MONTHS[m.month], S.cellBold), sc(n(m.production?.frame41Kg), S.cell),
      sc(n(m.production?.frame47Kg), S.cell), sc(prod, S.cellBold),
      sc(n(m.production?.spinningLossPercent), S.cell),
      sc(n(m.production?.autocornerLossPercent), S.cell),
      sc(n(m.metrics?.yarnRealisationPercent), S.cell),
      sc(n(m.metrics?.wastePercent), S.cell),
      sc(n(m.energy?.ukg), S.cell),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc(yearTotalProd, S.totalRow), ...Array(5).fill(sc('', S.totalRow)),
  ]);

  addSheet(wb, rows, 'Yearly Summary', [10, 14, 14, 14, 16, 18, 18, 12, 10]);
  download(wb, `SpinLytics_Yearly_${data.year}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 5: Production Log (Date Range)
// ─────────────────────────────────────────────────────────────
export function exportProductionLog(entries, dateRange) {
  const wb = createWorkbook();
  const rows = [];

  rows.push([sc('SPINLYTICS — PRODUCTION LOG', S.title), ...Array(9).fill(sc('', S.title))]);
  rows.push([sc(dateRange || 'All Entries', S.subtitle), ...Array(9).fill(sc('', S.subtitle))]);
  rows.push(Array(10).fill(empty()));

  rows.push([
    sc('Date', S.header), sc('Frame', S.header), sc('Production (kg)', S.header),
    sc('Autocorner (kg)', S.header), sc('Packing (kg)', S.header),
    sc('EB Units', S.header), sc('Spindles', S.header),
    sc('Spinning Loss %', S.headerBlue), sc('GPS', S.headerAmber), sc('Remarks', S.header),
  ]);

  (entries || []).forEach(e => {
    const c = e.calculated || {};
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.frameNumber === 'FRAME_41' ? 'F41' : 'F47', S.cellBold),
      sc(n(e.productionKg), S.cell), sc(n(e.autocornerProductionKg), S.cell),
      sc(n(e.packingKg), S.cell), sc(n(e.ebUnits), S.cell), sc(e.noOfSpindles, S.cell),
      sc(n(c.spinningLossPercent), n(c.spinningLossPercent) > 5 ? S.warning : S.cell),
      sc(n(c.gps), S.cell), sc(e.remarks || '', S.cellLeft),
    ]);
  });

  addSheet(wb, rows, 'Production Log', [14, 8, 16, 16, 14, 12, 10, 16, 10, 24]);
  download(wb, `SpinLytics_Production_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 6: Stock Transaction Log
// ─────────────────────────────────────────────────────────────
export function exportStockTransactionLog(transactions) {
  const wb = createWorkbook();
  const rows = [];

  rows.push([sc('SPINLYTICS — STOCK TRANSACTIONS', S.title), ...Array(8).fill(sc('', S.title))]);
  rows.push(Array(9).fill(empty()));

  rows.push([
    sc('Date', S.header), sc('Material', S.header), sc('Type', S.header),
    sc('Lot No', S.header), sc('Party', S.header), sc('Bags', S.header),
    sc('KG', S.header), sc('Price/Bag', S.header), sc('Remarks', S.header),
  ]);

  (transactions || []).forEach(t => {
    const isInflow = ['PURCHASE', 'RETURN'].includes(t.transactionType);
    const cellStyle = isInflow ? S.highlight : S.cell;
    rows.push([
      sc(new Date(t.date).toLocaleDateString('en-IN'), S.cell),
      sc(t.materialType, S.cellLeft), sc(t.transactionType, cellStyle),
      sc(t.lotNo, S.cellLeft), sc(t.partyName, S.cellLeft),
      sc(n(t.bags), S.cell), sc(n(t.kgs), S.cell),
      sc(t.pricePerBag ? n(t.pricePerBag) : '—', S.cell),
      sc(t.remarks || '', S.cellLeft),
    ]);
  });

  addSheet(wb, rows, 'Transactions', [14, 12, 12, 14, 20, 10, 12, 12, 20]);
  download(wb, `SpinLytics_Stock_Transactions.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 7: Packing Log
// ─────────────────────────────────────────────────────────────
export function exportPackingLog(entries) {
  const wb = createWorkbook();
  const rows = [];

  rows.push([sc('SPINLYTICS — PACKING LOG', S.title), ...Array(6).fill(sc('', S.title))]);
  rows.push(Array(7).fill(empty()));

  rows.push([
    sc('Date', S.header), sc('Source', S.header), sc('Yarn Type', S.header),
    sc('Lot No', S.header), sc('Bags', S.header), sc('KG', S.header), sc('Remarks', S.header),
  ]);

  (entries || []).forEach(e => {
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.source, e.source === 'AUTOCORNER' ? S.highlight : S.cell),
      sc(e.yarnType, S.cellLeft), sc(e.lotNo, S.cellLeft),
      sc(n(e.bags), S.cell), sc(n(e.kgs), S.cell),
      sc(e.remarks || '', S.cellLeft),
    ]);
  });

  addSheet(wb, rows, 'Packing Log', [14, 14, 18, 14, 10, 12, 20]);
  download(wb, `SpinLytics_Packing_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 8: Dispatch Log
// ─────────────────────────────────────────────────────────────
export function exportDispatchLog(entries) {
  const wb = createWorkbook();
  const rows = [];

  rows.push([sc('SPINLYTICS — DISPATCH LOG', S.title), ...Array(7).fill(sc('', S.title))]);
  rows.push(Array(8).fill(empty()));

  rows.push([
    sc('Date', S.header), sc('Material', S.header), sc('Lot No', S.header),
    sc('Party', S.header), sc('Bags', S.header), sc('KG', S.header),
    sc('Price/Bag', S.header), sc('Total Value', S.header),
  ]);

  let totalBags = 0, totalKg = 0, totalValue = 0;
  (entries || []).forEach(e => {
    const tv = n(e.totalPrice);
    totalBags += n(e.bags);
    totalKg += n(e.kgs);
    totalValue += tv;
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.materialType, S.cellLeft), sc(e.lotNo, S.cellLeft),
      sc(e.partyName, S.cellLeft), sc(n(e.bags), S.cell), sc(n(e.kgs), S.cell),
      sc(e.pricePerBag ? n(e.pricePerBag) : '—', S.cell),
      sc(tv || '—', S.cell),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc(totalBags, S.totalRow), sc(totalKg, S.totalRow),
    sc('', S.totalRow), sc(totalValue || '', S.totalRow),
  ]);

  addSheet(wb, rows, 'Dispatch Log', [14, 12, 14, 20, 10, 12, 12, 14]);
  download(wb, `SpinLytics_Dispatch_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 9: EB (Energy) Report
// ─────────────────────────────────────────────────────────────
export function exportEBReport(entries) {
  const wb = createWorkbook();
  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const rows = [];

  rows.push([sc('SPINLYTICS — EB (ENERGY) REPORT', S.title), ...Array(4).fill(sc('', S.title))]);
  rows.push(Array(5).fill(empty()));

  rows.push([
    sc('Month', S.header), sc('Year', S.header), sc('Opening', S.header),
    sc('Closing', S.header), sc('Units Consumed', S.header),
  ]);

  let totalConsumed = 0;
  (entries || []).forEach(e => {
    const consumed = n(e.calculated?.ebUnitsConsumed);
    totalConsumed += consumed;
    rows.push([
      sc(MONTHS[e.month] || e.month, S.cellLeft), sc(e.year, S.cell),
      sc(n(e.openingUnits), S.cell), sc(n(e.closingUnits), S.cell),
      sc(consumed, S.highlight),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc('', S.totalRow), sc(totalConsumed, S.totalRow),
  ]);

  addSheet(wb, rows, 'EB Report', [14, 8, 14, 14, 18]);
  download(wb, `SpinLytics_EB_Report.xlsx`);
}
