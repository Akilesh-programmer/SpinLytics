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
  lightTeal:'CCFBF1',
  lightRed: 'FEF2F2',
  lightAmber:'FEF3C7',
  lightBlue:'DBEAFE',
  lightPurple:'EDE9FE',
};

// ─── Style Presets ──────────────────────────────────────────
function borderAll(color) {
  const b = { style: 'thin', color: { rgb: color || C.gray } };
  return { top: b, bottom: b, left: b, right: b };
}

const S = {
  title: {
    font: { bold: true, sz: 16, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.tealDark } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.tealDark),
  },
  subtitle: {
    font: { bold: true, sz: 12, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
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
  headerRed: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.red } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.red),
  },
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: C.tealDark } },
    fill: { fgColor: { rgb: C.light } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  cell: {
    font: { sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  cellLeft: {
    font: { sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  cellBold: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  cellBoldLeft: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  totalRow: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.navy),
  },
  highlight: {
    font: { bold: true, sz: 10, color: { rgb: C.tealDark } },
    fill: { fgColor: { rgb: C.lightTeal } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  highlightBlue: {
    font: { bold: true, sz: 10, color: { rgb: '1E40AF' } },
    fill: { fgColor: { rgb: C.lightBlue } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  highlightPurple: {
    font: { bold: true, sz: 10, color: { rgb: '6D28D9' } },
    fill: { fgColor: { rgb: C.lightPurple } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  highlightAmber: {
    font: { bold: true, sz: 10, color: { rgb: '92400E' } },
    fill: { fgColor: { rgb: C.lightAmber } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  warning: {
    font: { bold: true, sz: 10, color: { rgb: C.red } },
    fill: { fgColor: { rgb: C.lightRed } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
  },
  percent: {
    font: { sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll(C.gray),
    numFmt: '0.00"%"',
  },
};

// ─── Helpers ────────────────────────────────────────────────
function n(v) { return v != null && v !== '' && v !== '—' ? Number(v) : 0; }

function createWorkbook() { return XLSX.utils.book_new(); }

function addSheet(wb, data, name, colWidths, merges) {
  const ws = XLSX.utils.aoa_to_sheet([]);
  const maxCols = Math.max(...data.map(r => r.length));

  // Set cell values and styles
  data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (cell && typeof cell === 'object' && cell.v !== undefined) {
        ws[addr] = { v: cell.v, t: cell.t || (typeof cell.v === 'number' ? 'n' : 's'), s: cell.s };
      } else if (cell !== undefined && cell !== null) {
        ws[addr] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
      }
    });
  });

  // Set sheet range
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: maxCols - 1 } });

  // Auto-calculate column widths: use provided widths as minimums, expand if content is larger
  const autoWidths = Array(maxCols).fill(8);
  data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (ci >= maxCols) return;
      // Skip merged title/subtitle rows for width calculation
      if (ri <= 1) return;
      const val = (cell && typeof cell === 'object' && cell.v !== undefined) ? cell.v : cell;
      if (val !== undefined && val !== null && val !== '') {
        const len = String(val).length;
        autoWidths[ci] = Math.max(autoWidths[ci], Math.min(len + 4, 50));
      }
    });
  });
  // Use whichever is larger: provided width or auto-calculated width
  const finalWidths = autoWidths.map((aw, i) => {
    const provided = colWidths && colWidths[i] ? colWidths[i] : 10;
    return Math.max(provided, aw);
  });
  ws['!cols'] = finalWidths.map(w => ({ wch: w }));

  // Row heights: title=30, subtitle=22, data rows auto-expand based on content
  ws['!rows'] = data.map((row, i) => {
    if (i === 0) return { hpt: 30 };
    if (i === 1) return { hpt: 22 };
    // Check if any cell in this row has long text that would wrap
    let maxLines = 1;
    row.forEach((cell, ci) => {
      const val = (cell && typeof cell === 'object' && cell.v !== undefined) ? cell.v : cell;
      if (val && typeof val === 'string') {
        const colW = finalWidths[ci] || 14;
        const lines = Math.ceil(val.length / colW);
        maxLines = Math.max(maxLines, lines);
      }
    });
    return { hpt: Math.max(18, maxLines * 15) };
  });

  // Merges
  if (merges) ws['!merges'] = merges;

  XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  return ws;
}

function sc(value, style) { return { v: value, s: style, t: typeof value === 'number' ? 'n' : 's' }; }
function empty() { return sc('', S.cell); }

// Merge range helper: { s: { r, c }, e: { r, c } }
function merge(r1, c1, r2, c2) { return { s: { r: r1, c: c1 }, e: { r: r2, c: c2 } }; }

function download(wb, filename) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), filename);
}

// Title row with merge across all columns
function titleRow(text, colCount, style) {
  return [sc(text, style || S.title), ...Array(colCount - 1).fill(sc('', style || S.title))];
}
function subtitleRow(text, colCount) {
  return [sc(text, S.subtitle), ...Array(colCount - 1).fill(sc('', S.subtitle))];
}
function sectionRow(text, colCount) {
  return [sc(text, S.sectionHeader), ...Array(colCount - 1).fill(sc('', S.sectionHeader))];
}
function emptyRow(colCount) { return Array(colCount).fill(empty()); }

// ─────────────────────────────────────────────────────────────
// REPORT 1: Daily Production Report (Enhanced)
// ─────────────────────────────────────────────────────────────
export function exportDailyProduction(data, dateStr) {
  const wb = createWorkbook();
  const { frames = [], totals } = data || {};
  const COLS = 11;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — DAILY PRODUCTION REPORT', COLS));
  rows.push(subtitleRow(`Date: ${dateStr}`, COLS));
  rows.push(emptyRow(COLS));

  // Production Data
  rows.push(sectionRow('PRODUCTION DATA', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  rows.push([
    sc('Frame', S.header), sc('Production (kg)', S.header), sc('Autocorner (kg)', S.header),
    sc('Packing (kg)', S.header), sc('EB Units', S.header), sc('Spindles', S.header),
    sc('Spinning Loss (kg)', S.headerBlue), sc('Spinning Loss %', S.headerBlue),
    sc('Autocorner Loss (kg)', S.headerPurple), sc('Autocorner Loss %', S.headerPurple),
    sc('Remarks', S.header),
  ]);

  frames.forEach(fr => {
    const c = fr.calculated || {};
    const prod = n(fr.productionKg);
    const auto = n(fr.autocornerProductionKg);
    const pack = n(fr.packingKg);
    const spinLossKg = prod - auto;
    const autoLossKg = auto - pack;
    rows.push([
      sc(fr.frameNumber === 'FRAME_41' ? 'Frame 41' : 'Frame 47', S.cellBoldLeft),
      sc(prod, S.cell), sc(auto, S.cell), sc(pack, S.cell),
      sc(n(fr.ebUnits), S.cell), sc(fr.noOfSpindles, S.cell),
      sc(spinLossKg, S.cell), sc(n(c.spinningLossPercent), n(c.spinningLossPercent) > 5 ? S.warning : S.cell),
      sc(autoLossKg, S.cell), sc(n(c.autocornerLossPercent), n(c.autocornerLossPercent) > 5 ? S.warning : S.cell),
      sc(fr.remarks || '—', S.cellLeft),
    ]);
  });

  // Totals row
  if (totals) {
    rows.push([
      sc('TOTAL', S.totalRow), sc(n(totals.totalProductionKg), S.totalRow),
      sc(n(totals.totalAutocornerKg), S.totalRow), sc(n(totals.totalPackingKg), S.totalRow),
      sc(n(totals.totalEBUnits), S.totalRow), sc(totals.totalSpindles, S.totalRow),
      sc(n(totals.totalProductionKg) - n(totals.totalAutocornerKg), S.totalRow),
      sc(n(totals.spinningLossPercent), S.totalRow),
      sc(n(totals.totalAutocornerKg) - n(totals.totalPackingKg), S.totalRow),
      sc(n(totals.autocornerLossPercent), S.totalRow),
      sc('', S.totalRow),
    ]);
  }

  rows.push(emptyRow(COLS));

  // Key Metrics Section
  rows.push(sectionRow('KEY PERFORMANCE METRICS', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  if (totals) {
    rows.push([sc('Metric', S.headerAmber), sc('Value', S.headerAmber), sc('Unit', S.headerAmber), sc('Status', S.headerAmber), ...Array(COLS - 4).fill(sc('', S.headerAmber))]);
    rows.push([sc('UKG (Energy/kg)', S.cellBoldLeft), sc(n(totals.ukg), S.highlight), sc('units/kg', S.cell), sc(n(totals.ukg) < 3 ? '✓ Efficient' : '⚠ Review', n(totals.ukg) < 3 ? S.highlight : S.highlightAmber), ...Array(COLS - 4).fill(empty())]);
    rows.push([sc('GPS (Gram/Spindle)', S.cellBoldLeft), sc(n(totals.gps), S.highlightBlue), sc('g/spindle', S.cell), sc('—', S.cell), ...Array(COLS - 4).fill(empty())]);
    rows.push([sc('Spinning Loss %', S.cellBoldLeft), sc(n(totals.spinningLossPercent), n(totals.spinningLossPercent) > 5 ? S.warning : S.highlight), sc('%', S.cell), sc(n(totals.spinningLossPercent) > 5 ? '⚠ HIGH' : '✓ Normal', n(totals.spinningLossPercent) > 5 ? S.warning : S.highlight), ...Array(COLS - 4).fill(empty())]);
    rows.push([sc('Autocorner Loss %', S.cellBoldLeft), sc(n(totals.autocornerLossPercent), n(totals.autocornerLossPercent) > 5 ? S.warning : S.highlight), sc('%', S.cell), sc(n(totals.autocornerLossPercent) > 5 ? '⚠ HIGH' : '✓ Normal', n(totals.autocornerLossPercent) > 5 ? S.warning : S.highlight), ...Array(COLS - 4).fill(empty())]);
    rows.push([sc('Overall Yield', S.cellBoldLeft), sc(n(totals.totalPackingKg) > 0 ? ((n(totals.totalPackingKg) / n(totals.totalProductionKg)) * 100).toFixed(2) : 0, S.highlightPurple), sc('%', S.cell), sc('Packing/Production', S.cell), ...Array(COLS - 4).fill(empty())]);
    const totalLossKg = n(totals.totalProductionKg) - n(totals.totalPackingKg);
    rows.push([sc('Total Material Lost', S.cellBoldLeft), sc(totalLossKg, S.warning), sc('kg', S.cell), sc('Production - Packing', S.cell), ...Array(COLS - 4).fill(empty())]);
    rows.push([sc('Avg Production/Frame', S.cellBoldLeft), sc(frames.length > 0 ? (n(totals.totalProductionKg) / frames.length).toFixed(2) : 0, S.cell), sc('kg', S.cell), sc(`${frames.length} frames`, S.cell), ...Array(COLS - 4).fill(empty())]);
  }

  rows.push(emptyRow(COLS));

  // Frame Comparison Section (if both frames exist)
  if (frames.length === 2) {
    rows.push(sectionRow('FRAME-WISE COMPARISON', COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([sc('Metric', S.headerPurple), sc('Frame 41', S.headerPurple), sc('Frame 47', S.headerPurple), sc('Better Frame', S.headerPurple), ...Array(COLS - 4).fill(sc('', S.headerPurple))]);
    const f41 = frames.find(f => f.frameNumber === 'FRAME_41');
    const f47 = frames.find(f => f.frameNumber === 'FRAME_47');
    if (f41 && f47) {
      const c41 = f41.calculated || {}; const c47 = f47.calculated || {};
      rows.push([sc('Production (kg)', S.cellBoldLeft), sc(n(f41.productionKg), S.cell), sc(n(f47.productionKg), S.cell), sc(n(f41.productionKg) >= n(f47.productionKg) ? 'Frame 41' : 'Frame 47', S.highlight), ...Array(COLS - 4).fill(empty())]);
      rows.push([sc('Spinning Loss %', S.cellBoldLeft), sc(n(c41.spinningLossPercent), n(c41.spinningLossPercent) > 5 ? S.warning : S.cell), sc(n(c47.spinningLossPercent), n(c47.spinningLossPercent) > 5 ? S.warning : S.cell), sc(n(c41.spinningLossPercent) <= n(c47.spinningLossPercent) ? 'Frame 41' : 'Frame 47', S.highlight), ...Array(COLS - 4).fill(empty())]);
      rows.push([sc('UKG', S.cellBoldLeft), sc(n(c41.ukg), S.cell), sc(n(c47.ukg), S.cell), sc(n(c41.ukg) <= n(c47.ukg) ? 'Frame 41' : 'Frame 47', S.highlight), ...Array(COLS - 4).fill(empty())]);
      rows.push([sc('GPS', S.cellBoldLeft), sc(n(c41.gps), S.cell), sc(n(c47.gps), S.cell), sc(n(c41.gps) >= n(c47.gps) ? 'Frame 41' : 'Frame 47', S.highlight), ...Array(COLS - 4).fill(empty())]);
    }
    rows.push(emptyRow(COLS));
  }

  rows.push(sectionRow(`Report generated: ${new Date().toLocaleString('en-IN')}`, COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(wb, rows, 'Daily Production', [14, 16, 16, 14, 12, 10, 16, 14, 18, 16, 28], merges);
  download(wb, `SpinLytics_Daily_Production_${dateStr}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 2: Monthly Realisation Report (Enhanced)
// ─────────────────────────────────────────────────────────────
export function exportMonthlyRealisation(data) {
  const wb = createWorkbook();
  const COLS = 7;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];
  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  rows.push(titleRow('SPINLYTICS — MONTHLY REALISATION REPORT', COLS));
  rows.push(subtitleRow(`${MONTHS[data.month]} ${data.year}`, COLS));
  rows.push(emptyRow(COLS));

  // ─ Production Section ─
  rows.push(sectionRow('PRODUCTION SUMMARY', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.header), sc('Frame 41', S.header), sc('Frame 47', S.header), sc('Total', S.header), sc('Unit', S.header), sc('Days', S.header), sc('Avg/Day', S.header)]);

  const totalProd = n(data.production?.totalProductionKg);
  const days = data.production?.daysRecorded || 1;
  rows.push([sc('Spinning Production', S.cellBoldLeft), sc(n(data.production?.frame41Kg), S.cell), sc(n(data.production?.frame47Kg), S.cell), sc(totalProd, S.cellBold), sc('kg', S.cell), sc(days, S.cell), sc(totalProd / days, S.cell)]);
  rows.push([sc('Autocorner Production', S.cellBoldLeft), sc('—', S.cell), sc('—', S.cell), sc(n(data.production?.totalAutocornerKg), S.cellBold), sc('kg', S.cell), empty(), empty()]);
  rows.push([sc('Packing', S.cellBoldLeft), sc('—', S.cell), sc('—', S.cell), sc(n(data.production?.totalPackingKg), S.cellBold), sc('kg', S.cell), empty(), empty()]);

  rows.push(emptyRow(COLS));

  // ─ Loss Section ─
  rows.push(sectionRow('LOSS ANALYSIS', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.header), sc('Loss (kg)', S.headerBlue), sc('Loss %', S.headerBlue), sc('Status', S.header), ...Array(COLS - 4).fill(sc('', S.header))]);

  const slp = n(data.production?.spinningLossPercent);
  const alp = n(data.production?.autocornerLossPercent);
  const spinLossKg = totalProd - n(data.production?.totalAutocornerKg);
  const autoLossKg = n(data.production?.totalAutocornerKg) - n(data.production?.totalPackingKg);
  rows.push([sc('Spinning Loss', S.cellBoldLeft), sc(spinLossKg, S.cell), sc(slp, slp > 5 ? S.warning : S.highlight), sc(slp > 5 ? '⚠ HIGH' : '✓ OK', slp > 5 ? S.warning : S.highlight), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Autocorner Loss', S.cellBoldLeft), sc(autoLossKg, S.cell), sc(alp, alp > 5 ? S.warning : S.highlight), sc(alp > 5 ? '⚠ HIGH' : '✓ OK', alp > 5 ? S.warning : S.highlight), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Total Loss', S.cellBoldLeft), sc(spinLossKg + autoLossKg, S.warning), sc('—', S.cell), sc('', S.cell), ...Array(COLS - 4).fill(empty())]);

  rows.push(emptyRow(COLS));

  // ─ Raw Materials Section ─
  rows.push(sectionRow('RAW MATERIAL ISSUE', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Material', S.header), sc('Issue (kg)', S.header), sc('% of Total', S.header), ...Array(COLS - 3).fill(sc('', S.header))]);
  const ci = n(data.rawMaterials?.totalCottonIssueKg);
  const matItems = [
    ['Cotton', n(data.rawMaterials?.cottonIssueKg)],
    ['Fiber', n(data.rawMaterials?.fiberIssueKg)],
    ['Viscose', n(data.rawMaterials?.viscoseIssueKg)],
    ['Excel', n(data.rawMaterials?.excelIssueKg)],
  ];
  matItems.forEach(([name, val]) => {
    rows.push([sc(name, S.cellBoldLeft), sc(val, S.cell), sc(ci > 0 ? ((val / ci) * 100).toFixed(1) : 0, S.cell), ...Array(COLS - 3).fill(empty())]);
  });
  rows.push([sc('TOTAL COTTON ISSUE', S.totalRow), sc(ci, S.totalRow), sc('100%', S.totalRow), ...Array(COLS - 3).fill(sc('', S.totalRow))]);

  rows.push(emptyRow(COLS));

  // ─ Key Metrics ─
  rows.push(sectionRow('KEY METRICS', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.header), sc('Value', S.header), sc('Unit', S.header), sc('Formula', S.header), ...Array(COLS - 4).fill(sc('', S.header))]);
  rows.push([sc('Yarn Realisation', S.cellBoldLeft), sc(n(data.metrics?.yarnRealisationPercent), S.highlight), sc('%', S.cell), sc('Production / Cotton Issue × 100', S.cellLeft), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Waste', S.cellBoldLeft), sc(n(data.metrics?.wastePercent), S.highlightAmber), sc('%', S.cell), sc('Waste / Cotton Issue × 100', S.cellLeft), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Invisible Loss', S.cellBoldLeft), sc(n(data.metrics?.invisibleLossPercent), n(data.metrics?.invisibleLossPercent) > 3 ? S.warning : S.cell), sc('%', S.cell), sc('100 - Realisation - Waste', S.cellLeft), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Total Waste', S.cellBoldLeft), sc(n(data.metrics?.totalWasteKg), S.cell), sc('kg', S.cell), sc('', S.cell), ...Array(COLS - 4).fill(empty())]);

  rows.push(emptyRow(COLS));

  // ─ Energy Section ─
  rows.push(sectionRow('ENERGY CONSUMPTION', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('EB Units Consumed', S.cellBoldLeft), sc(n(data.energy?.ebUnitsConsumed), S.highlightAmber), empty(), empty(), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('UKG', S.cellBoldLeft), sc(n(data.energy?.ukg), S.highlight), sc('units/kg', S.cell), sc('EB Units / Production', S.cellLeft), ...Array(COLS - 4).fill(empty())]);

  rows.push(emptyRow(COLS));
  rows.push(sectionRow(`Report generated: ${new Date().toLocaleString('en-IN')}`, COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(wb, rows, 'Monthly Realisation', [22, 16, 14, 14, 10, 10, 28], merges);
  download(wb, `SpinLytics_Monthly_${MONTHS[data.month]}_${data.year}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 3: Stock Report (Lot-wise) — Enhanced
// ─────────────────────────────────────────────────────────────
export function exportStockReport(data) {
  const wb = createWorkbook();
  const COLS = 9;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];
  const { currentStock = [], lotWise = [], recentTransactions = [] } = data || {};

  rows.push(titleRow('SPINLYTICS — STOCK REPORT', COLS));
  rows.push(subtitleRow(`Generated: ${new Date().toLocaleDateString('en-IN')}`, COLS));
  rows.push(emptyRow(COLS));

  // Current Stock
  rows.push(sectionRow('CURRENT STOCK SUMMARY', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Material', S.header), sc('Stock (Bags)', S.header), sc('Stock (kg)', S.header), sc('Value Status', S.header), ...Array(COLS - 4).fill(sc('', S.header))]);
  let totalStockKg = 0;
  currentStock.forEach(s => {
    const kg = n(s.currentStockKg);
    totalStockKg += kg;
    rows.push([sc(s.materialType, S.cellBoldLeft), sc(n(s.currentStockBags), S.cell), sc(kg, S.cellBold), sc(kg > 0 ? 'In Stock' : 'Out of Stock', kg > 0 ? S.highlight : S.warning), ...Array(COLS - 4).fill(empty())]);
  });
  rows.push([sc('TOTAL', S.totalRow), sc('', S.totalRow), sc(totalStockKg, S.totalRow), sc('', S.totalRow), ...Array(COLS - 4).fill(sc('', S.totalRow))]);

  rows.push(emptyRow(COLS));

  // Lot-wise Stock
  rows.push(sectionRow('LOT-WISE STOCK BREAKDOWN', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Material', S.header), sc('Lot No', S.header), sc('Stock (kg)', S.header), ...Array(COLS - 3).fill(sc('', S.header))]);
  const sorted = [...lotWise].sort((a, b) => a.materialType.localeCompare(b.materialType));
  let prevMaterial = '';
  sorted.forEach(item => {
    const isSameMaterial = item.materialType === prevMaterial;
    rows.push([sc(isSameMaterial ? '' : item.materialType, isSameMaterial ? S.cellLeft : S.cellBoldLeft), sc(item.lotNo, S.cellLeft), sc(n(item.kgs), S.cell), ...Array(COLS - 3).fill(empty())]);
    prevMaterial = item.materialType;
  });

  rows.push(emptyRow(COLS));

  // Recent Transactions
  rows.push(sectionRow('RECENT TRANSACTIONS (Last 20)', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc('Date', S.header), sc('Material', S.header), sc('Type', S.header),
    sc('Lot No', S.header), sc('Party', S.header), sc('Bags', S.header),
    sc('KG', S.header), sc('Price/Bag', S.header), sc('Remarks', S.header),
  ]);
  recentTransactions.forEach(txn => {
    const isInflow = ['PURCHASE', 'RETURN'].includes(txn.transactionType);
    const typeStyle = isInflow ? S.highlight : S.highlightAmber;
    rows.push([
      sc(new Date(txn.date).toLocaleDateString('en-IN'), S.cell),
      sc(txn.materialType, S.cellLeft), sc(txn.transactionType, typeStyle),
      sc(txn.lotNo, S.cellLeft), sc(txn.partyName, S.cellLeft),
      sc(n(txn.bags), S.cell), sc(n(txn.kgs), S.cell),
      sc(txn.pricePerBag ? n(txn.pricePerBag) : '—', S.cell),
      sc(txn.remarks || '—', S.cellLeft),
    ]);
  });

  addSheet(wb, rows, 'Stock Report', [14, 14, 14, 14, 22, 12, 12, 12, 28], merges);
  download(wb, `SpinLytics_Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 4: Yearly Summary Report (Enhanced)
// ─────────────────────────────────────────────────────────────
export function exportYearlySummary(data) {
  const wb = createWorkbook();
  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const COLS = 12;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(titleRow(`SPINLYTICS — YEARLY REPORT ${data.year}`, COLS));
  rows.push(emptyRow(COLS));

  // Monthly Production Breakdown
  rows.push(sectionRow('MONTHLY PRODUCTION BREAKDOWN', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc('Month', S.header), sc('Frame 41 (kg)', S.header), sc('Frame 47 (kg)', S.header),
    sc('Total Prod (kg)', S.header), sc('Packing (kg)', S.header),
    sc('Spinning Loss %', S.headerBlue), sc('Auto Loss %', S.headerPurple),
    sc('Yarn Realisation %', S.header), sc('Waste %', S.headerAmber), sc('Invisible Loss %', S.headerRed),
    sc('UKG', S.header), sc('Days', S.header),
  ]);

  let yearTotalProd = 0, yearTotalPack = 0, yearTotalF41 = 0, yearTotalF47 = 0;
  (data.months || []).forEach(m => {
    const prod = n(m.production?.totalProductionKg);
    const pack = n(m.production?.totalPackingKg);
    const f41 = n(m.production?.frame41Kg);
    const f47 = n(m.production?.frame47Kg);
    yearTotalProd += prod;
    yearTotalPack += pack;
    yearTotalF41 += f41;
    yearTotalF47 += f47;
    if (prod === 0) return;
    rows.push([
      sc(MONTHS[m.month], S.cellBold), sc(f41, S.cell), sc(f47, S.cell),
      sc(prod, S.cellBold), sc(pack, S.cell),
      sc(n(m.production?.spinningLossPercent), S.cell), sc(n(m.production?.autocornerLossPercent), S.cell),
      sc(n(m.metrics?.yarnRealisationPercent), S.highlight), sc(n(m.metrics?.wastePercent), S.cell),
      sc(n(m.metrics?.invisibleLossPercent), n(m.metrics?.invisibleLossPercent) > 3 ? S.warning : S.cell),
      sc(n(m.energy?.ukg), S.cell), sc(m.production?.daysRecorded || 0, S.cell),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc(yearTotalF41, S.totalRow), sc(yearTotalF47, S.totalRow),
    sc(yearTotalProd, S.totalRow), sc(yearTotalPack, S.totalRow),
    ...Array(COLS - 5).fill(sc('', S.totalRow)),
  ]);

  rows.push(emptyRow(COLS));

  // Yearly Aggregated KPIs
  rows.push(sectionRow('YEARLY KEY PERFORMANCE INDICATORS', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.headerAmber), sc('Value', S.headerAmber), sc('Unit', S.headerAmber), ...Array(COLS - 3).fill(sc('', S.headerAmber))]);
  rows.push([sc('Total Production', S.cellBoldLeft), sc(yearTotalProd, S.highlight), sc('kg', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Total Packing', S.cellBoldLeft), sc(yearTotalPack, S.highlightBlue), sc('kg', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Frame 41 Share', S.cellBoldLeft), sc(yearTotalProd > 0 ? ((yearTotalF41 / yearTotalProd) * 100).toFixed(1) : 0, S.cell), sc('%', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Frame 47 Share', S.cellBoldLeft), sc(yearTotalProd > 0 ? ((yearTotalF47 / yearTotalProd) * 100).toFixed(1) : 0, S.cell), sc('%', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Overall Yield', S.cellBoldLeft), sc(yearTotalProd > 0 ? ((yearTotalPack / yearTotalProd) * 100).toFixed(1) : 0, S.highlightPurple), sc('%', S.cell), ...Array(COLS - 3).fill(empty())]);
  const totalLostYear = yearTotalProd - yearTotalPack;
  rows.push([sc('Total Material Lost', S.cellBoldLeft), sc(totalLostYear, S.warning), sc('kg', S.cell), ...Array(COLS - 3).fill(empty())]);

  // Active months and averages
  const activeMonths = (data.months || []).filter(m => n(m.production?.totalProductionKg) > 0);
  const totalDays = activeMonths.reduce((s, m) => s + (m.production?.daysRecorded || 0), 0);
  rows.push([sc('Active Months', S.cellBoldLeft), sc(activeMonths.length, S.cell), sc('/ 12', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Total Working Days', S.cellBoldLeft), sc(totalDays, S.cell), sc('days', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Avg Monthly Production', S.cellBoldLeft), sc(activeMonths.length > 0 ? (yearTotalProd / activeMonths.length).toFixed(0) : 0, S.highlight), sc('kg/month', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Avg Daily Production', S.cellBoldLeft), sc(totalDays > 0 ? (yearTotalProd / totalDays).toFixed(1) : 0, S.cell), sc('kg/day', S.cell), ...Array(COLS - 3).fill(empty())]);

  rows.push(emptyRow(COLS));

  // Energy section
  const yearEB = activeMonths.reduce((s, m) => s + n(m.energy?.ebUnitsConsumed), 0);
  rows.push(sectionRow('ENERGY CONSUMPTION (YEARLY)', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.headerAmber), sc('Value', S.headerAmber), sc('Unit', S.headerAmber), ...Array(COLS - 3).fill(sc('', S.headerAmber))]);
  rows.push([sc('Total EB Consumed', S.cellBoldLeft), sc(yearEB, S.highlightAmber), sc('units', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Avg UKG (Year)', S.cellBoldLeft), sc(yearTotalProd > 0 ? (yearEB / yearTotalProd).toFixed(4) : 0, S.highlight), sc('units/kg', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Avg Monthly EB', S.cellBoldLeft), sc(activeMonths.length > 0 ? (yearEB / activeMonths.length).toFixed(0) : 0, S.cell), sc('units/month', S.cell), ...Array(COLS - 3).fill(empty())]);

  rows.push(emptyRow(COLS));

  // Raw Materials section
  const yrCotton = activeMonths.reduce((s, m) => s + n(m.rawMaterials?.cottonIssueKg), 0);
  const yrFiber = activeMonths.reduce((s, m) => s + n(m.rawMaterials?.fiberIssueKg), 0);
  const yrViscose = activeMonths.reduce((s, m) => s + n(m.rawMaterials?.viscoseIssueKg), 0);
  const yrExcel = activeMonths.reduce((s, m) => s + n(m.rawMaterials?.excelIssueKg), 0);
  const yrTotalCI = yrCotton + yrFiber + yrViscose + yrExcel;
  if (yrTotalCI > 0) {
    rows.push(sectionRow('RAW MATERIAL ISSUE (YEARLY)', COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([sc('Material', S.header), sc('Total (kg)', S.header), sc('Share %', S.header), ...Array(COLS - 3).fill(sc('', S.header))]);
    rows.push([sc('Cotton', S.cellBoldLeft), sc(yrCotton, S.cell), sc(((yrCotton / yrTotalCI) * 100).toFixed(1), S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('Fiber', S.cellBoldLeft), sc(yrFiber, S.cell), sc(((yrFiber / yrTotalCI) * 100).toFixed(1), S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('Viscose', S.cellBoldLeft), sc(yrViscose, S.cell), sc(((yrViscose / yrTotalCI) * 100).toFixed(1), S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('Excel', S.cellBoldLeft), sc(yrExcel, S.cell), sc(((yrExcel / yrTotalCI) * 100).toFixed(1), S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('TOTAL', S.totalRow), sc(yrTotalCI, S.totalRow), sc('100%', S.totalRow), ...Array(COLS - 3).fill(sc('', S.totalRow))]);

    rows.push(emptyRow(COLS));
    rows.push([sc('Yarn Realisation (Year)', S.cellBoldLeft), sc(((yearTotalProd / yrTotalCI) * 100).toFixed(2), S.highlight), sc('%', S.cell), ...Array(COLS - 3).fill(empty())]);
    const yrWaste = activeMonths.reduce((s, m) => s + n(m.metrics?.totalWasteKg), 0);
    rows.push([sc('Total Waste', S.cellBoldLeft), sc(yrWaste, S.highlightAmber), sc('kg', S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('Waste %', S.cellBoldLeft), sc(((yrWaste / yrTotalCI) * 100).toFixed(2), S.cell), sc('%', S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push(emptyRow(COLS));
  }

  // Best/Worst Month
  if (activeMonths.length > 1) {
    const sorted = [...activeMonths].sort((a, b) => n(b.production?.totalProductionKg) - n(a.production?.totalProductionKg));
    rows.push(sectionRow('PERFORMANCE HIGHLIGHTS', COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([sc('Best Month (Prod)', S.cellBoldLeft), sc(MONTHS[sorted[0].month], S.highlight), sc(`${n(sorted[0].production?.totalProductionKg).toFixed(0)} kg`, S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('Lowest Month (Prod)', S.cellBoldLeft), sc(MONTHS[sorted[sorted.length - 1].month], S.highlightAmber), sc(`${n(sorted[sorted.length - 1].production?.totalProductionKg).toFixed(0)} kg`, S.cell), ...Array(COLS - 3).fill(empty())]);
    const ukgMonths = activeMonths.filter(m => n(m.energy?.ukg) > 0).sort((a, b) => n(a.energy?.ukg) - n(b.energy?.ukg));
    if (ukgMonths.length > 0) {
      rows.push([sc('Best UKG Month', S.cellBoldLeft), sc(MONTHS[ukgMonths[0].month], S.highlight), sc(`UKG: ${ukgMonths[0].energy?.ukg}`, S.cell), ...Array(COLS - 3).fill(empty())]);
      if (ukgMonths.length > 1) rows.push([sc('Worst UKG Month', S.cellBoldLeft), sc(MONTHS[ukgMonths[ukgMonths.length - 1].month], S.warning), sc(`UKG: ${ukgMonths[ukgMonths.length - 1].energy?.ukg}`, S.cell), ...Array(COLS - 3).fill(empty())]);
    }
  }

  rows.push(emptyRow(COLS));
  rows.push(sectionRow(`Report generated: ${new Date().toLocaleString('en-IN')}`, COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(wb, rows, 'Yearly Summary', [10, 14, 14, 16, 14, 14, 14, 16, 12, 16, 10, 8], merges);
  download(wb, `SpinLytics_Yearly_${data.year}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 5: Production Log (Date Range) — Enhanced
// ─────────────────────────────────────────────────────────────
export function exportProductionLog(entries, dateRange) {
  const wb = createWorkbook();
  const COLS = 12;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — PRODUCTION LOG', COLS));
  rows.push(subtitleRow(dateRange || `All Entries (${entries?.length || 0} records)`, COLS));
  rows.push(emptyRow(COLS));

  rows.push([
    sc('Date', S.header), sc('Frame', S.header), sc('Production (kg)', S.header),
    sc('Autocorner (kg)', S.header), sc('Packing (kg)', S.header),
    sc('EB Units', S.header), sc('Spindles', S.header),
    sc('Spin Loss (kg)', S.headerBlue), sc('Spin Loss %', S.headerBlue),
    sc('GPS', S.headerAmber), sc('UKG', S.headerPurple), sc('Remarks', S.header),
  ]);

  let totProd = 0, totAuto = 0, totPack = 0, totEB = 0;
  (entries || []).forEach(e => {
    const c = e.calculated || {};
    const prod = n(e.productionKg);
    const auto = n(e.autocornerProductionKg);
    const pack = n(e.packingKg);
    totProd += prod; totAuto += auto; totPack += pack; totEB += n(e.ebUnits);
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.frameNumber === 'FRAME_41' ? 'F41' : 'F47', S.cellBold),
      sc(prod, S.cell), sc(auto, S.cell), sc(pack, S.cell),
      sc(n(e.ebUnits), S.cell), sc(e.noOfSpindles, S.cell),
      sc(prod - auto, S.cell),
      sc(n(c.spinningLossPercent), n(c.spinningLossPercent) > 5 ? S.warning : S.cell),
      sc(n(c.gps), S.highlightAmber), sc(n(c.ukg), S.cell),
      sc(e.remarks || '—', S.cellLeft),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc(totProd, S.totalRow),
    sc(totAuto, S.totalRow), sc(totPack, S.totalRow), sc(totEB, S.totalRow),
    ...Array(COLS - 6).fill(sc('', S.totalRow)),
  ]);

  addSheet(wb, rows, 'Production Log', [14, 6, 16, 16, 14, 12, 10, 14, 12, 10, 10, 28], merges);
  download(wb, `SpinLytics_Production_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 6: Stock Transaction Log — Enhanced
// ─────────────────────────────────────────────────────────────
export function exportStockTransactionLog(transactions) {
  const wb = createWorkbook();
  const COLS = 10;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — STOCK TRANSACTIONS', COLS));
  rows.push(emptyRow(COLS));

  rows.push([
    sc('Date', S.header), sc('Material', S.header), sc('Type', S.header),
    sc('Lot No', S.header), sc('Party', S.header), sc('Bags', S.header),
    sc('KG', S.header), sc('Price/Bag', S.header), sc('Total Price', S.header), sc('Remarks', S.header),
  ]);

  let totBags = 0, totKg = 0, totVal = 0;
  (transactions || []).forEach(t => {
    const isInflow = ['PURCHASE', 'RETURN'].includes(t.transactionType);
    const cellStyle = isInflow ? S.highlight : S.cell;
    const tp = n(t.totalPrice);
    totBags += n(t.bags); totKg += n(t.kgs); totVal += tp;
    rows.push([
      sc(new Date(t.date).toLocaleDateString('en-IN'), S.cell),
      sc(t.materialType, S.cellLeft), sc(t.transactionType, cellStyle),
      sc(t.lotNo, S.cellLeft), sc(t.partyName, S.cellLeft),
      sc(n(t.bags), S.cell), sc(n(t.kgs), S.cell),
      sc(t.pricePerBag ? n(t.pricePerBag) : '—', S.cell),
      sc(tp || '—', S.cell), sc(t.remarks || '—', S.cellLeft),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), ...Array(4).fill(sc('', S.totalRow)),
    sc(totBags, S.totalRow), sc(totKg, S.totalRow), sc('', S.totalRow),
    sc(totVal || '', S.totalRow), sc('', S.totalRow),
  ]);

  addSheet(wb, rows, 'Transactions', [14, 12, 12, 14, 22, 10, 12, 12, 14, 28], merges);
  download(wb, `SpinLytics_Stock_Transactions.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 7: Packing Log — Enhanced
// ─────────────────────────────────────────────────────────────
export function exportPackingLog(entries) {
  const wb = createWorkbook();
  const COLS = 7;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — PACKING LOG', COLS));
  rows.push(emptyRow(COLS));

  rows.push([
    sc('Date', S.header), sc('Source', S.header), sc('Yarn Type', S.header),
    sc('Lot No', S.header), sc('Bags', S.header), sc('KG', S.header), sc('Remarks', S.header),
  ]);

  let totBags = 0, totKg = 0;
  (entries || []).forEach(e => {
    totBags += n(e.bags); totKg += n(e.kgs);
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.source, e.source === 'AUTOCORNER' ? S.highlight : S.highlightBlue),
      sc(e.yarnType, S.cellLeft), sc(e.lotNo, S.cellLeft),
      sc(n(e.bags), S.cell), sc(n(e.kgs), S.cell),
      sc(e.remarks || '—', S.cellLeft),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc(totBags, S.totalRow), sc(totKg, S.totalRow), sc('', S.totalRow),
  ]);

  addSheet(wb, rows, 'Packing Log', [14, 14, 18, 14, 10, 12, 28], merges);
  download(wb, `SpinLytics_Packing_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 8: Dispatch Log — Enhanced
// ─────────────────────────────────────────────────────────────
export function exportDispatchLog(entries) {
  const wb = createWorkbook();
  const COLS = 9;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — DISPATCH LOG', COLS));
  rows.push(emptyRow(COLS));

  rows.push([
    sc('Date', S.header), sc('Material', S.header), sc('Lot No', S.header),
    sc('Party', S.header), sc('Bags', S.header), sc('KG', S.header),
    sc('Price/Bag (₹)', S.header), sc('Total Value (₹)', S.headerAmber), sc('Remarks', S.header),
  ]);

  let totalBags = 0, totalKg = 0, totalValue = 0;
  (entries || []).forEach(e => {
    const tv = n(e.totalPrice);
    totalBags += n(e.bags); totalKg += n(e.kgs); totalValue += tv;
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.materialType, S.cellLeft), sc(e.lotNo, S.cellLeft),
      sc(e.partyName, S.cellLeft), sc(n(e.bags), S.cell), sc(n(e.kgs), S.cell),
      sc(e.pricePerBag ? n(e.pricePerBag) : '—', S.cell),
      sc(tv || '—', tv > 0 ? S.highlightAmber : S.cell),
      sc(e.remarks || '—', S.cellLeft),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc(totalBags, S.totalRow), sc(totalKg, S.totalRow),
    sc('', S.totalRow), sc(totalValue || '', S.totalRow), sc('', S.totalRow),
  ]);

  // Party-wise summary
  rows.push(emptyRow(COLS));
  rows.push(sectionRow('PARTY-WISE DISPATCH SUMMARY', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Party', S.header), sc('Total Bags', S.header), sc('Total KG', S.header), sc('Total Value (₹)', S.header), ...Array(COLS - 4).fill(sc('', S.header))]);
  const partyMap = {};
  (entries || []).forEach(e => {
    if (!partyMap[e.partyName]) partyMap[e.partyName] = { bags: 0, kgs: 0, value: 0 };
    partyMap[e.partyName].bags += n(e.bags);
    partyMap[e.partyName].kgs += n(e.kgs);
    partyMap[e.partyName].value += n(e.totalPrice);
  });
  Object.entries(partyMap).sort((a, b) => b[1].kgs - a[1].kgs).forEach(([party, d]) => {
    rows.push([sc(party, S.cellBoldLeft), sc(d.bags, S.cell), sc(d.kgs, S.cell), sc(d.value || '—', S.cell), ...Array(COLS - 4).fill(empty())]);
  });

  addSheet(wb, rows, 'Dispatch Log', [14, 14, 14, 22, 10, 12, 14, 16, 28], merges);
  download(wb, `SpinLytics_Dispatch_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 9: EB (Energy) Report — Enhanced
// ─────────────────────────────────────────────────────────────
export function exportEBReport(entries) {
  const wb = createWorkbook();
  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const COLS = 6;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — EB (ENERGY) REPORT', COLS));
  rows.push(emptyRow(COLS));

  rows.push([
    sc('Month', S.header), sc('Year', S.header), sc('Opening Units', S.header),
    sc('Closing Units', S.header), sc('Units Consumed', S.headerAmber), sc('Change vs Prev', S.header),
  ]);

  let totalConsumed = 0;
  let prevConsumed = null;
  (entries || []).forEach(e => {
    const consumed = n(e.closingUnits) - n(e.openingUnits);
    totalConsumed += consumed;
    const change = prevConsumed !== null ? consumed - prevConsumed : null;
    const changeStr = change !== null ? (change > 0 ? `+${change.toFixed(0)}` : change.toFixed(0)) : '—';
    const changeStyle = change === null ? S.cell : (change > 0 ? S.warning : S.highlight);
    rows.push([
      sc(MONTHS[e.month] || e.month, S.cellBoldLeft), sc(e.year, S.cell),
      sc(n(e.openingUnits), S.cell), sc(n(e.closingUnits), S.cell),
      sc(consumed, S.highlightAmber), sc(changeStr, changeStyle),
    ]);
    prevConsumed = consumed;
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc('', S.totalRow), sc(totalConsumed, S.totalRow), sc('', S.totalRow),
  ]);

  // Summary stats
  rows.push(emptyRow(COLS));
  rows.push(sectionRow('SUMMARY STATISTICS', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  const count = (entries || []).length;
  const avg = count > 0 ? totalConsumed / count : 0;
  rows.push([sc('Total Consumed', S.cellBoldLeft), sc(totalConsumed, S.highlightAmber), sc('units', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Monthly Average', S.cellBoldLeft), sc(avg.toFixed(0), S.cell), sc('units/month', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Months Recorded', S.cellBoldLeft), sc(count, S.cell), empty(), ...Array(COLS - 3).fill(empty())]);

  addSheet(wb, rows, 'EB Report', [14, 8, 16, 16, 18, 16], merges);
  download(wb, `SpinLytics_EB_Report.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 10: Material-wise Stock Movement
// ─────────────────────────────────────────────────────────────
export function exportMaterialMovement(stockData) {
  const wb = createWorkbook();
  const COLS = 8;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];
  const { recentTransactions = [] } = stockData || {};

  rows.push(titleRow('SPINLYTICS — MATERIAL-WISE STOCK MOVEMENT', COLS));
  rows.push(emptyRow(COLS));

  // Group transactions by material
  const materialGroups = {};
  recentTransactions.forEach(t => {
    if (!materialGroups[t.materialType]) materialGroups[t.materialType] = { purchase: 0, issue: 0, dispatch: 0, ret: 0, bags: 0 };
    const kgs = n(t.kgs);
    const bags = n(t.bags);
    materialGroups[t.materialType].bags += bags;
    switch (t.transactionType) {
      case 'PURCHASE': materialGroups[t.materialType].purchase += kgs; break;
      case 'ISSUE': materialGroups[t.materialType].issue += kgs; break;
      case 'DISPATCH': materialGroups[t.materialType].dispatch += kgs; break;
      case 'RETURN': materialGroups[t.materialType].ret += kgs; break;
    }
  });

  rows.push([
    sc('Material', S.header), sc('Purchase (kg)', S.header), sc('Issue (kg)', S.headerBlue),
    sc('Dispatch (kg)', S.headerPurple), sc('Return (kg)', S.header),
    sc('Net Inflow (kg)', S.headerAmber), sc('Total Bags', S.header), sc('Status', S.header),
  ]);

  Object.entries(materialGroups).forEach(([mat, d]) => {
    const net = d.purchase + d.ret - d.issue - d.dispatch;
    rows.push([
      sc(mat, S.cellBoldLeft), sc(d.purchase, S.highlight), sc(d.issue, S.cell),
      sc(d.dispatch, S.cell), sc(d.ret, S.cell),
      sc(net, net >= 0 ? S.highlight : S.warning), sc(d.bags, S.cell),
      sc(net >= 0 ? 'Net Positive' : 'Net Negative', net >= 0 ? S.highlight : S.warning),
    ]);
  });

  addSheet(wb, rows, 'Material Movement', [14, 16, 14, 16, 14, 16, 12, 14], merges);
  download(wb, `SpinLytics_Material_Movement.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 11: Loss Analysis Report
// ─────────────────────────────────────────────────────────────
export function exportLossAnalysis(entries) {
  const wb = createWorkbook();
  const COLS = 10;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — LOSS ANALYSIS REPORT', COLS));
  rows.push(emptyRow(COLS));

  rows.push([
    sc('Date', S.header), sc('Frame', S.header),
    sc('Production (kg)', S.header), sc('Autocorner (kg)', S.header), sc('Packing (kg)', S.header),
    sc('Spin Loss (kg)', S.headerBlue), sc('Spin Loss %', S.headerBlue),
    sc('Auto Loss (kg)', S.headerPurple), sc('Auto Loss %', S.headerPurple),
    sc('Total Loss (kg)', S.headerRed),
  ]);

  let totSLoss = 0, totALoss = 0;
  (entries || []).forEach(e => {
    const prod = n(e.productionKg);
    const auto = n(e.autocornerProductionKg);
    const pack = n(e.packingKg);
    const sLoss = prod - auto;
    const aLoss = auto - pack;
    const sLossPct = prod > 0 ? (sLoss / prod * 100) : 0;
    const aLossPct = auto > 0 ? (aLoss / auto * 100) : 0;
    totSLoss += sLoss; totALoss += aLoss;
    rows.push([
      sc(new Date(e.date).toLocaleDateString('en-IN'), S.cell),
      sc(e.frameNumber === 'FRAME_41' ? 'F41' : 'F47', S.cellBold),
      sc(prod, S.cell), sc(auto, S.cell), sc(pack, S.cell),
      sc(sLoss, S.cell), sc(sLossPct.toFixed(2), sLossPct > 5 ? S.warning : S.cell),
      sc(aLoss, S.cell), sc(aLossPct.toFixed(2), aLossPct > 5 ? S.warning : S.cell),
      sc(sLoss + aLoss, S.warning),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc(totSLoss, S.totalRow), sc('', S.totalRow),
    sc(totALoss, S.totalRow), sc('', S.totalRow),
    sc(totSLoss + totALoss, S.totalRow),
  ]);

  addSheet(wb, rows, 'Loss Analysis', [14, 6, 16, 16, 14, 14, 12, 14, 12, 16], merges);
  download(wb, `SpinLytics_Loss_Analysis.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 12: Weekly Production Summary
// ─────────────────────────────────────────────────────────────
export function exportWeeklyProduction(entries, dateRange) {
  const wb = createWorkbook();
  const COLS = 12;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — WEEKLY PRODUCTION SUMMARY', COLS));
  rows.push(subtitleRow(dateRange || 'All Data', COLS));
  rows.push(emptyRow(COLS));

  // Group entries by week
  const weekMap = {};
  (entries || []).forEach(e => {
    const d = new Date(e.date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `W${weekNo} (${d.getFullYear()})`;
    if (!weekMap[key]) weekMap[key] = { prod: 0, auto: 0, pack: 0, eb: 0, spindles: 0, days: new Set(), entries: 0 };
    weekMap[key].prod += n(e.productionKg);
    weekMap[key].auto += n(e.autocornerProductionKg);
    weekMap[key].pack += n(e.packingKg);
    weekMap[key].eb += n(e.ebUnits);
    weekMap[key].spindles += e.noOfSpindles;
    weekMap[key].days.add(new Date(e.date).toDateString());
    weekMap[key].entries++;
  });

  rows.push(sectionRow('WEEKLY BREAKDOWN', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc('Week', S.header), sc('Days', S.header), sc('Entries', S.header),
    sc('Production (kg)', S.header), sc('Autocorner (kg)', S.header), sc('Packing (kg)', S.header),
    sc('Spin Loss (kg)', S.headerBlue), sc('Spin Loss %', S.headerBlue),
    sc('EB Units', S.headerAmber), sc('UKG', S.headerPurple),
    sc('Avg Prod/Day', S.header), sc('Overall Yield %', S.header),
  ]);

  let totProd = 0, totAuto = 0, totPack = 0, totEB = 0;
  Object.entries(weekMap).forEach(([week, d]) => {
    const spinLoss = d.prod - d.auto;
    const spinLossPct = d.prod > 0 ? (spinLoss / d.prod * 100).toFixed(2) : 0;
    const ukg = d.prod > 0 ? (d.eb / d.prod).toFixed(4) : '—';
    const yieldPct = d.prod > 0 ? ((d.pack / d.prod) * 100).toFixed(1) : '0';
    const avgProdDay = d.days.size > 0 ? (d.prod / d.days.size).toFixed(1) : '0';
    totProd += d.prod; totAuto += d.auto; totPack += d.pack; totEB += d.eb;
    rows.push([
      sc(week, S.cellBoldLeft), sc(d.days.size, S.cell), sc(d.entries, S.cell),
      sc(d.prod, S.cellBold), sc(d.auto, S.cell), sc(d.pack, S.cell),
      sc(spinLoss, S.cell), sc(spinLossPct, n(spinLossPct) > 5 ? S.warning : S.cell),
      sc(d.eb, S.highlightAmber), sc(ukg, S.cell),
      sc(avgProdDay, S.highlight), sc(yieldPct, S.cell),
    ]);
  });

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow), sc('', S.totalRow),
    sc(totProd, S.totalRow), sc(totAuto, S.totalRow), sc(totPack, S.totalRow),
    sc(totProd - totAuto, S.totalRow), sc('', S.totalRow),
    sc(totEB, S.totalRow), sc(totProd > 0 ? (totEB / totProd).toFixed(4) : '', S.totalRow),
    sc('', S.totalRow), sc(totProd > 0 ? ((totPack / totProd) * 100).toFixed(1) : '', S.totalRow),
  ]);

  rows.push(emptyRow(COLS));
  rows.push(sectionRow(`Report generated: ${new Date().toLocaleString('en-IN')}`, COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(wb, rows, 'Weekly Summary', [16, 8, 8, 16, 16, 14, 14, 12, 12, 10, 14, 14], merges);
  download(wb, `SpinLytics_Weekly_Production.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 13: Monthly Day-wise Detailed Report
// ─────────────────────────────────────────────────────────────
export function exportMonthlyDaywise(data, prodEntries) {
  const wb = createWorkbook();
  const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const COLS = 14;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — MONTHLY DAY-WISE PRODUCTION', COLS));
  rows.push(subtitleRow(`${MONTHS[data.month]} ${data.year}`, COLS));
  rows.push(emptyRow(COLS));

  // Aggregate by day
  const dayMap = {};
  (prodEntries || []).forEach(e => {
    const day = new Date(e.date).getDate();
    if (!dayMap[day]) dayMap[day] = { prod: 0, auto: 0, pack: 0, eb: 0, spindles: 0, frames: [] };
    dayMap[day].prod += n(e.productionKg);
    dayMap[day].auto += n(e.autocornerProductionKg);
    dayMap[day].pack += n(e.packingKg);
    dayMap[day].eb += n(e.ebUnits);
    dayMap[day].spindles += e.noOfSpindles;
    dayMap[day].frames.push(e.frameNumber === 'FRAME_41' ? 'F41' : 'F47');
  });

  rows.push(sectionRow('DAY-BY-DAY PRODUCTION DATA', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc('Day', S.header), sc('Frames', S.header),
    sc('Production (kg)', S.header), sc('Autocorner (kg)', S.header), sc('Packing (kg)', S.header),
    sc('Spin Loss (kg)', S.headerBlue), sc('Spin Loss %', S.headerBlue),
    sc('Auto Loss (kg)', S.headerPurple), sc('Auto Loss %', S.headerPurple),
    sc('Total Loss (kg)', S.headerRed), sc('EB Units', S.headerAmber),
    sc('UKG', S.header), sc('GPS', S.header), sc('Yield %', S.header),
  ]);

  let totP = 0, totA = 0, totPk = 0, totEB = 0;
  const lastDay = new Date(data.year, data.month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const day = dayMap[d];
    if (!day) {
      rows.push([sc(d, S.cell), sc('—', S.cell), ...Array(COLS - 2).fill(sc('—', S.cell))]);
      continue;
    }
    const sL = day.prod - day.auto;
    const aL = day.auto - day.pack;
    const sLP = day.prod > 0 ? (sL / day.prod * 100).toFixed(2) : 0;
    const aLP = day.auto > 0 ? (aL / day.auto * 100).toFixed(2) : 0;
    const ukg = day.prod > 0 ? (day.eb / day.prod).toFixed(4) : '—';
    const gps = day.spindles > 0 ? (day.prod / day.spindles).toFixed(4) : '—';
    const yld = day.prod > 0 ? ((day.pack / day.prod) * 100).toFixed(1) : '0';
    totP += day.prod; totA += day.auto; totPk += day.pack; totEB += day.eb;
    rows.push([
      sc(d, S.cellBold), sc(day.frames.join(', '), S.cell),
      sc(day.prod, S.cellBold), sc(day.auto, S.cell), sc(day.pack, S.cell),
      sc(sL, S.cell), sc(sLP, n(sLP) > 5 ? S.warning : S.cell),
      sc(aL, S.cell), sc(aLP, n(aLP) > 5 ? S.warning : S.cell),
      sc(sL + aL, S.warning), sc(day.eb, S.highlightAmber),
      sc(ukg, S.cell), sc(gps, S.highlight), sc(yld, S.cell),
    ]);
  }

  rows.push([
    sc('TOTAL', S.totalRow), sc('', S.totalRow),
    sc(totP, S.totalRow), sc(totA, S.totalRow), sc(totPk, S.totalRow),
    sc(totP - totA, S.totalRow), sc('', S.totalRow),
    sc(totA - totPk, S.totalRow), sc('', S.totalRow),
    sc(totP - totPk, S.totalRow), sc(totEB, S.totalRow),
    sc(totP > 0 ? (totEB / totP).toFixed(4) : '', S.totalRow),
    sc('', S.totalRow),
    sc(totP > 0 ? ((totPk / totP) * 100).toFixed(1) : '', S.totalRow),
  ]);

  rows.push(emptyRow(COLS));

  // Summary statistics
  const activeDays = Object.keys(dayMap).length;
  rows.push(sectionRow('MONTHLY SUMMARY', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.headerAmber), sc('Value', S.headerAmber), sc('Unit', S.headerAmber), ...Array(COLS - 3).fill(sc('', S.headerAmber))]);
  rows.push([sc('Active Production Days', S.cellBoldLeft), sc(activeDays, S.highlight), sc('days', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Total Calendar Days', S.cellBoldLeft), sc(lastDay, S.cell), sc('days', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Utilization', S.cellBoldLeft), sc(((activeDays / lastDay) * 100).toFixed(0), S.highlightBlue), sc('%', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Avg Daily Production', S.cellBoldLeft), sc(activeDays > 0 ? (totP / activeDays).toFixed(1) : 0, S.highlight), sc('kg/day', S.cell), ...Array(COLS - 3).fill(empty())]);
  rows.push([sc('Avg Daily EB', S.cellBoldLeft), sc(activeDays > 0 ? (totEB / activeDays).toFixed(0) : 0, S.highlightAmber), sc('units/day', S.cell), ...Array(COLS - 3).fill(empty())]);

  // Best/worst day
  const dayEntries = Object.entries(dayMap);
  if (dayEntries.length > 1) {
    const sorted = [...dayEntries].sort((a, b) => b[1].prod - a[1].prod);
    rows.push(emptyRow(COLS));
    rows.push([sc('Best Day (Production)', S.cellBoldLeft), sc(`Day ${sorted[0][0]}`, S.highlight), sc(`${sorted[0][1].prod.toFixed(0)} kg`, S.cell), ...Array(COLS - 3).fill(empty())]);
    rows.push([sc('Lowest Day (Production)', S.cellBoldLeft), sc(`Day ${sorted[sorted.length - 1][0]}`, S.highlightAmber), sc(`${sorted[sorted.length - 1][1].prod.toFixed(0)} kg`, S.cell), ...Array(COLS - 3).fill(empty())]);
  }

  rows.push(emptyRow(COLS));
  rows.push(sectionRow(`Report generated: ${new Date().toLocaleString('en-IN')}`, COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(wb, rows, 'Day-wise Production', [6, 10, 16, 16, 14, 14, 12, 14, 12, 14, 12, 10, 10, 10], merges);
  download(wb, `SpinLytics_Monthly_Daywise_${MONTHS[data.month]}_${data.year}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 14: Frame Comparison Report
// ─────────────────────────────────────────────────────────────
export function exportFrameComparison(entries, dateRange) {
  const wb = createWorkbook();
  const COLS = 9;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow('SPINLYTICS — FRAME COMPARISON REPORT', COLS));
  rows.push(subtitleRow(dateRange || 'All Data', COLS));
  rows.push(emptyRow(COLS));

  // Split entries by frame
  const f41 = { prod: 0, auto: 0, pack: 0, eb: 0, spindles: 0, count: 0 };
  const f47 = { prod: 0, auto: 0, pack: 0, eb: 0, spindles: 0, count: 0 };
  (entries || []).forEach(e => {
    const target = e.frameNumber === 'FRAME_41' ? f41 : f47;
    target.prod += n(e.productionKg);
    target.auto += n(e.autocornerProductionKg);
    target.pack += n(e.packingKg);
    target.eb += n(e.ebUnits);
    target.spindles += e.noOfSpindles;
    target.count++;
  });

  rows.push(sectionRow('FRAME COMPARISON OVERVIEW', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.header), sc('Frame 41', S.header), sc('Frame 47', S.header), sc('Total', S.header), sc('F41 Share %', S.headerBlue), sc('F47 Share %', S.headerPurple), sc('Better', S.header), ...Array(COLS - 7).fill(sc('', S.header))]);

  const totalProd = f41.prod + f47.prod;
  const mkShare = (v, t) => t > 0 ? ((v / t) * 100).toFixed(1) : '0';

  rows.push([sc('Production (kg)', S.cellBoldLeft), sc(f41.prod, S.cell), sc(f47.prod, S.cell), sc(totalProd, S.cellBold), sc(mkShare(f41.prod, totalProd), S.cell), sc(mkShare(f47.prod, totalProd), S.cell), sc(f41.prod >= f47.prod ? 'F41' : 'F47', S.highlight), ...Array(COLS - 7).fill(empty())]);
  rows.push([sc('Autocorner (kg)', S.cellBoldLeft), sc(f41.auto, S.cell), sc(f47.auto, S.cell), sc(f41.auto + f47.auto, S.cellBold), sc(mkShare(f41.auto, f41.auto + f47.auto), S.cell), sc(mkShare(f47.auto, f41.auto + f47.auto), S.cell), sc('—', S.cell), ...Array(COLS - 7).fill(empty())]);
  rows.push([sc('Packing (kg)', S.cellBoldLeft), sc(f41.pack, S.cell), sc(f47.pack, S.cell), sc(f41.pack + f47.pack, S.cellBold), sc('', S.cell), sc('', S.cell), sc('—', S.cell), ...Array(COLS - 7).fill(empty())]);
  rows.push([sc('EB Units', S.cellBoldLeft), sc(f41.eb, S.highlightAmber), sc(f47.eb, S.highlightAmber), sc(f41.eb + f47.eb, S.cellBold), sc('', S.cell), sc('', S.cell), sc('—', S.cell), ...Array(COLS - 7).fill(empty())]);
  rows.push([sc('Entries', S.cellBoldLeft), sc(f41.count, S.cell), sc(f47.count, S.cell), sc(f41.count + f47.count, S.cellBold), sc('', S.cell), sc('', S.cell), sc('—', S.cell), ...Array(COLS - 7).fill(empty())]);

  rows.push(emptyRow(COLS));

  // Efficiency comparison
  rows.push(sectionRow('EFFICIENCY COMPARISON', COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([sc('Metric', S.headerAmber), sc('Frame 41', S.headerAmber), sc('Frame 47', S.headerAmber), sc('Better', S.headerAmber), ...Array(COLS - 4).fill(sc('', S.headerAmber))]);

  const f41SL = f41.prod > 0 ? ((f41.prod - f41.auto) / f41.prod * 100).toFixed(2) : 0;
  const f47SL = f47.prod > 0 ? ((f47.prod - f47.auto) / f47.prod * 100).toFixed(2) : 0;
  const f41AL = f41.auto > 0 ? ((f41.auto - f41.pack) / f41.auto * 100).toFixed(2) : 0;
  const f47AL = f47.auto > 0 ? ((f47.auto - f47.pack) / f47.auto * 100).toFixed(2) : 0;
  const f41UKG = f41.prod > 0 ? (f41.eb / f41.prod).toFixed(4) : '—';
  const f47UKG = f47.prod > 0 ? (f47.eb / f47.prod).toFixed(4) : '—';
  const f41GPS = f41.spindles > 0 ? (f41.prod / f41.spindles).toFixed(4) : '—';
  const f47GPS = f47.spindles > 0 ? (f47.prod / f47.spindles).toFixed(4) : '—';
  const f41Yield = f41.prod > 0 ? ((f41.pack / f41.prod) * 100).toFixed(1) : '0';
  const f47Yield = f47.prod > 0 ? ((f47.pack / f47.prod) * 100).toFixed(1) : '0';

  rows.push([sc('Spinning Loss %', S.cellBoldLeft), sc(f41SL, n(f41SL) > 5 ? S.warning : S.cell), sc(f47SL, n(f47SL) > 5 ? S.warning : S.cell), sc(n(f41SL) <= n(f47SL) ? 'F41 ✓' : 'F47 ✓', S.highlight), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Autocorner Loss %', S.cellBoldLeft), sc(f41AL, n(f41AL) > 5 ? S.warning : S.cell), sc(f47AL, n(f47AL) > 5 ? S.warning : S.cell), sc(n(f41AL) <= n(f47AL) ? 'F41 ✓' : 'F47 ✓', S.highlight), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('UKG', S.cellBoldLeft), sc(f41UKG, S.cell), sc(f47UKG, S.cell), sc(n(f41UKG) <= n(f47UKG) ? 'F41 ✓' : 'F47 ✓', S.highlight), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('GPS (g/spindle)', S.cellBoldLeft), sc(f41GPS, S.cell), sc(f47GPS, S.cell), sc(n(f41GPS) >= n(f47GPS) ? 'F41 ✓' : 'F47 ✓', S.highlight), ...Array(COLS - 4).fill(empty())]);
  rows.push([sc('Overall Yield %', S.cellBoldLeft), sc(f41Yield, S.cell), sc(f47Yield, S.cell), sc(n(f41Yield) >= n(f47Yield) ? 'F41 ✓' : 'F47 ✓', S.highlight), ...Array(COLS - 4).fill(empty())]);

  rows.push(emptyRow(COLS));
  rows.push(sectionRow(`Report generated: ${new Date().toLocaleString('en-IN')}`, COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(wb, rows, 'Frame Comparison', [18, 14, 14, 14, 14, 14, 12, 10, 10], merges);
  download(wb, `SpinLytics_Frame_Comparison.xlsx`);
}
