import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

// ─── Color Palette ─────────────────────────────────────────
const C = {
  teal: "00D4AA",
  tealDark: "0A1A2F",
  navy: "0F2A3F",
  blue: "3B82F6",
  purple: "8B5CF6",
  amber: "F59E0B",
  red: "EF4444",
  green: "10B981",
  cyan: "06B6D4",
  white: "FFFFFF",
  light: "F1F5F9",
  gray: "E2E8F0",
  darkGray: "64748B",
  lightTeal: "CCFBF1",
  lightRed: "FEF2F2",
  lightAmber: "FEF3C7",
  lightBlue: "DBEAFE",
  lightPurple: "EDE9FE",
};

// ─── Style Presets ──────────────────────────────────────────
function borderAll(color) {
  const b = { style: "thin", color: { rgb: color || C.gray } };
  return { top: b, bottom: b, left: b, right: b };
}

const S = {
  title: {
    font: { bold: true, sz: 16, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.tealDark } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.tealDark),
  },
  subtitle: {
    font: { bold: true, sz: 12, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.navy),
  },
  header: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.teal } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.teal),
  },
  headerBlue: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.blue } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.blue),
  },
  headerPurple: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.purple } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.purple),
  },
  headerAmber: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.amber } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.amber),
  },
  headerRed: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.red } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.red),
  },
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: C.tealDark } },
    fill: { fgColor: { rgb: C.light } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  cell: {
    font: { sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  cellLeft: {
    font: { sz: 10 },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  cellBold: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  cellBoldLeft: {
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  totalRow: {
    font: { bold: true, sz: 11, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.navy } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.navy),
  },
  highlight: {
    font: { bold: true, sz: 10, color: { rgb: C.tealDark } },
    fill: { fgColor: { rgb: C.lightTeal } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  highlightBlue: {
    font: { bold: true, sz: 10, color: { rgb: "1E40AF" } },
    fill: { fgColor: { rgb: C.lightBlue } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  highlightPurple: {
    font: { bold: true, sz: 10, color: { rgb: "6D28D9" } },
    fill: { fgColor: { rgb: C.lightPurple } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  highlightAmber: {
    font: { bold: true, sz: 10, color: { rgb: "92400E" } },
    fill: { fgColor: { rgb: C.lightAmber } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  warning: {
    font: { bold: true, sz: 10, color: { rgb: C.red } },
    fill: { fgColor: { rgb: C.lightRed } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
  },
  percent: {
    font: { sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderAll(C.gray),
    numFmt: '0.00"%"',
  },
};

// ─── Helpers ────────────────────────────────────────────────
function n(v) {
  return v != null && v !== "" && v !== "—" ? Number(v) : 0;
}

function createWorkbook() {
  return XLSX.utils.book_new();
}

function addSheet(wb, data, name, colWidths, merges) {
  const ws = XLSX.utils.aoa_to_sheet([]);
  const maxCols = Math.max(...data.map((r) => r.length));

  // Set cell values and styles
  data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      if (cell && typeof cell === "object" && cell.v !== undefined) {
        ws[addr] = {
          v: cell.v,
          t: cell.t || (typeof cell.v === "number" ? "n" : "s"),
          s: cell.s,
        };
      } else if (cell !== undefined && cell !== null) {
        ws[addr] = { v: cell, t: typeof cell === "number" ? "n" : "s" };
      }
    });
  });

  // Set sheet range
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: data.length - 1, c: maxCols - 1 },
  });

  // Auto-calculate column widths: use provided widths as minimums, expand if content is larger
  const autoWidths = Array(maxCols).fill(8);
  data.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (ci >= maxCols) return;
      // Skip merged title/subtitle rows for width calculation
      if (ri <= 1) return;
      const val =
        cell && typeof cell === "object" && cell.v !== undefined
          ? cell.v
          : cell;
      if (val !== undefined && val !== null && val !== "") {
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
  ws["!cols"] = finalWidths.map((w) => ({ wch: w }));

  // Row heights: title=30, subtitle=22, data rows auto-expand based on content
  ws["!rows"] = data.map((row, i) => {
    if (i === 0) return { hpt: 30 };
    if (i === 1) return { hpt: 22 };
    // Check if any cell in this row has long text that would wrap
    let maxLines = 1;
    row.forEach((cell, ci) => {
      const val =
        cell && typeof cell === "object" && cell.v !== undefined
          ? cell.v
          : cell;
      if (val && typeof val === "string") {
        const colW = finalWidths[ci] || 14;
        const lines = Math.ceil(val.length / colW);
        maxLines = Math.max(maxLines, lines);
      }
    });
    return { hpt: Math.max(18, maxLines * 15) };
  });

  // Merges
  if (merges) ws["!merges"] = merges;

  XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  return ws;
}

function sc(value, style) {
  return { v: value, s: style, t: typeof value === "number" ? "n" : "s" };
}
function empty() {
  return sc("", S.cell);
}

// Merge range helper: { s: { r, c }, e: { r, c } }
function merge(r1, c1, r2, c2) {
  return { s: { r: r1, c: c1 }, e: { r: r2, c: c2 } };
}

function download(wb, filename) {
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), filename);
}

// Title row with merge across all columns
function titleRow(text, colCount, style) {
  return [
    sc(text, style || S.title),
    ...Array(colCount - 1).fill(sc("", style || S.title)),
  ];
}
function subtitleRow(text, colCount) {
  return [
    sc(text, S.subtitle),
    ...Array(colCount - 1).fill(sc("", S.subtitle)),
  ];
}
function sectionRow(text, colCount) {
  return [
    sc(text, S.sectionHeader),
    ...Array(colCount - 1).fill(sc("", S.sectionHeader)),
  ];
}
function emptyRow(colCount) {
  return Array(colCount).fill(empty());
}

// ─────────────────────────────────────────────────────────────
// REPORT 1: Daily Production Report (Enhanced)
// ─────────────────────────────────────────────────────────────
export function exportDailyProduction(data, dateStr) {
  const wb = createWorkbook();
  const { entries = [], countSummaries = [], totals } = data || {};
  const COLS = 12;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — DAILY PRODUCTION REPORT (2026)", COLS));
  rows.push(subtitleRow(`Date: ${dateStr}`, COLS));
  rows.push(emptyRow(COLS));

  // Shift Entries Detail
  rows.push(sectionRow("SHIFT PRODUCTION ENTRIES", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  rows.push([
    sc("R/F No.", S.header),
    sc("Sider", S.header),
    sc("Count", S.header),
    sc("Actual HK", S.header),
    sc("Gross Kg", S.header),
    sc("Net Kg", S.header),
    sc("Waste Kg", S.headerAmber),
    sc("Waste %", S.headerAmber),
    sc("Efficiency %", S.headerBlue),
    sc("Wkd Spindles", S.header),
    sc("G/Spindle", S.headerPurple),
    sc("Stoppages", S.header),
  ]);

  entries.forEach((e) => {
    const c = e.calculated || {};
    const wastePct = n(c.wastePercent);
    const effPct = n(c.efficiencyPercent);
    rows.push([
      sc(e.rfNo, S.cellBold),
      sc(e.siderName, S.cellLeft),
      sc(e.count, S.highlight),
      sc(n(e.actualHK), S.cell),
      sc(n(c.productionKgsGross), S.cell),
      sc(n(c.actualProductionKgs), S.cell),
      sc(n(e.wasteKgs), S.cell),
      sc(wastePct, wastePct > 5 ? S.warning : S.cell),
      sc(effPct, effPct < 80 ? S.warning : S.highlight),
      sc(n(c.workedSpindles), S.cell),
      sc(n(c.gramsPerSpindle), S.highlightPurple),
      sc(e.stoppages || "—", S.cellLeft),
    ]);
  });

  // Grand Totals
  if (totals) {
    rows.push([
      sc("TOTAL", S.totalRow),
      sc(`${totals.entryCount} entries`, S.totalRow),
      sc("", S.totalRow),
      sc("", S.totalRow),
      sc(n(totals.totalGrossKgs), S.totalRow),
      sc(n(totals.totalNetKgs), S.totalRow),
      sc(n(totals.totalWasteKgs), S.totalRow),
      sc(`${totals.wastePercent}%`, S.totalRow),
      sc(`${totals.avgEfficiency}%`, S.totalRow),
      ...Array(COLS - 9).fill(sc("", S.totalRow)),
    ]);
  }

  rows.push(emptyRow(COLS));

  // Count-wise Summary
  if (countSummaries.length > 0) {
    rows.push(sectionRow("COUNT-WISE SUMMARY", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Count", S.header),
      sc("Entries", S.header),
      sc("Gross Kg", S.header),
      sc("Net Kg", S.header),
      sc("Waste Kg", S.headerAmber),
      sc("Waste %", S.headerAmber),
      sc("Avg Eff %", S.headerBlue),
      ...Array(COLS - 7).fill(sc("", S.header)),
    ]);
    countSummaries.forEach((cs) => {
      rows.push([
        sc(cs.count, S.cellBold),
        sc(cs.entryCount, S.cell),
        sc(n(cs.totalGrossKgs), S.cell),
        sc(n(cs.totalNetKgs), S.cell),
        sc(n(cs.totalWasteKgs), S.cell),
        sc(`${cs.wastePercent}%`, S.cell),
        sc(`${cs.avgEfficiency}%`, S.highlight),
        ...Array(COLS - 7).fill(empty()),
      ]);
    });
    rows.push(emptyRow(COLS));
  }

  // Key Metrics
  if (totals) {
    rows.push(sectionRow("KEY PERFORMANCE METRICS", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Metric", S.headerAmber),
      sc("Value", S.headerAmber),
      sc("Unit", S.headerAmber),
      sc("Status", S.headerAmber),
      ...Array(COLS - 4).fill(sc("", S.headerAmber)),
    ]);
    rows.push([
      sc("Gross Production", S.cellBoldLeft),
      sc(n(totals.totalGrossKgs), S.highlight),
      sc("kg", S.cell),
      sc("ActualHK × STDConst", S.cellLeft),
      ...Array(COLS - 4).fill(empty()),
    ]);
    rows.push([
      sc("Net Production", S.cellBoldLeft),
      sc(n(totals.totalNetKgs), S.highlight),
      sc("kg", S.cell),
      sc("Gross − Waste", S.cellLeft),
      ...Array(COLS - 4).fill(empty()),
    ]);
    rows.push([
      sc("Total Waste", S.cellBoldLeft),
      sc(n(totals.totalWasteKgs), S.highlightAmber),
      sc("kg", S.cell),
      sc(`${totals.wastePercent}%`, S.cell),
      ...Array(COLS - 4).fill(empty()),
    ]);
    const eff = n(totals.avgEfficiency);
    rows.push([
      sc("Avg Efficiency", S.cellBoldLeft),
      sc(eff, eff < 80 ? S.warning : S.highlight),
      sc("%", S.cell),
      sc(
        eff < 80 ? "⚠ Below Target" : "✓ On Target",
        eff < 80 ? S.warning : S.highlight,
      ),
      ...Array(COLS - 4).fill(empty()),
    ]);
  }

  rows.push(emptyRow(COLS));
  rows.push(
    sectionRow(`Report generated: ${new Date().toLocaleString("en-IN")}`, COLS),
  );
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(
    wb,
    rows,
    "Daily Production",
    [10, 16, 10, 12, 12, 12, 12, 10, 12, 14, 12, 28],
    merges,
  );
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
  const MONTHS = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  rows.push(titleRow("SPINLYTICS — MONTHLY REALISATION REPORT (2026)", COLS));
  rows.push(subtitleRow(`${MONTHS[data.month]} ${data.year}`, COLS));
  rows.push(emptyRow(COLS));

  // ─ Production Section ─
  rows.push(sectionRow("PRODUCTION SUMMARY", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.header),
    sc("Value", S.header),
    sc("Unit", S.header),
    sc("Days", S.header),
    sc("Avg/Day", S.header),
    sc("Efficiency", S.headerBlue),
    sc("Notes", S.header),
  ]);

  const totalGross = n(data.production?.totalGrossKgs);
  const totalNet = n(data.production?.totalNetKgs);
  const totalShiftWaste = n(data.production?.totalShiftWasteKgs);
  const days = data.production?.daysRecorded || 1;
  const avgEff = data.production?.avgEfficiency || "0";
  rows.push([
    sc("Gross Production", S.cellBoldLeft),
    sc(totalGross, S.cellBold),
    sc("kg", S.cell),
    sc(days, S.cell),
    sc((totalGross / days).toFixed(1), S.cell),
    sc(`${avgEff}%`, S.highlight),
    sc("ActualHK × STDConst", S.cellLeft),
  ]);
  rows.push([
    sc("Net Production", S.cellBoldLeft),
    sc(totalNet, S.cellBold),
    sc("kg", S.cell),
    empty(),
    empty(),
    empty(),
    sc("Gross − Waste", S.cellLeft),
  ]);
  rows.push([
    sc("Shift Waste", S.cellBoldLeft),
    sc(totalShiftWaste, S.highlightAmber),
    sc("kg", S.cell),
    empty(),
    empty(),
    empty(),
    sc(`${data.production?.shiftWastePercent || 0}% of gross`, S.cellLeft),
  ]);

  rows.push(emptyRow(COLS));

  // ─ Count-wise Breakdown ─
  const countBreakdown = data.production?.countBreakdown || [];
  if (countBreakdown.length > 0) {
    rows.push(sectionRow("COUNT-WISE PRODUCTION BREAKDOWN", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Count", S.header),
      sc("Gross (kg)", S.header),
      sc("Net (kg)", S.header),
      sc("Waste (kg)", S.headerAmber),
      sc("Waste %", S.headerAmber),
      sc("Avg Eff %", S.headerBlue),
      sc("% of Total", S.header),
    ]);
    countBreakdown.forEach((cb) => {
      rows.push([
        sc(cb.count, S.cellBold),
        sc(n(cb.grossKgs), S.cell),
        sc(n(cb.netKgs), S.cell),
        sc(n(cb.wasteKgs), S.cell),
        sc(`${cb.wastePercent}%`, S.cell),
        sc(`${cb.avgEfficiency}%`, S.highlight),
        sc(`${cb.percentOfTotal}%`, S.cell),
      ]);
    });
    rows.push(emptyRow(COLS));
  }

  // ─ Raw Materials Section ─
  rows.push(sectionRow("RAW MATERIAL ISSUE", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Material", S.header),
    sc("Issue (kg)", S.header),
    sc("% of Total", S.header),
    ...Array(COLS - 3).fill(sc("", S.header)),
  ]);
  const ci = n(data.rawMaterials?.totalCottonIssueKg);
  const matItems = [
    ["Cotton", n(data.rawMaterials?.cottonIssueKg)],
    ["Fiber", n(data.rawMaterials?.fiberIssueKg)],
    ["Viscose", n(data.rawMaterials?.viscoseIssueKg)],
    ["Excel", n(data.rawMaterials?.excelIssueKg)],
  ];
  matItems.forEach(([name, val]) => {
    rows.push([
      sc(name, S.cellBoldLeft),
      sc(val, S.cell),
      sc(ci > 0 ? ((val / ci) * 100).toFixed(1) : 0, S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
  });
  rows.push([
    sc("TOTAL COTTON ISSUE", S.totalRow),
    sc(ci, S.totalRow),
    sc("100%", S.totalRow),
    ...Array(COLS - 3).fill(sc("", S.totalRow)),
  ]);

  rows.push(emptyRow(COLS));

  // ─ Key Metrics ─
  rows.push(sectionRow("KEY METRICS", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.header),
    sc("Value", S.header),
    sc("Unit", S.header),
    sc("Formula", S.header),
    ...Array(COLS - 4).fill(sc("", S.header)),
  ]);
  rows.push([
    sc("Yarn Realisation", S.cellBoldLeft),
    sc(n(data.metrics?.yarnRealisationPercent), S.highlight),
    sc("%", S.cell),
    sc("Gross Production / Cotton Issue × 100", S.cellLeft),
    ...Array(COLS - 4).fill(empty()),
  ]);
  rows.push([
    sc("Waste", S.cellBoldLeft),
    sc(n(data.metrics?.wastePercent), S.highlightAmber),
    sc("%", S.cell),
    sc("Stock Waste / Cotton Issue × 100", S.cellLeft),
    ...Array(COLS - 4).fill(empty()),
  ]);
  rows.push([
    sc("Invisible Loss", S.cellBoldLeft),
    sc(
      n(data.metrics?.invisibleLossPercent),
      n(data.metrics?.invisibleLossPercent) > 3 ? S.warning : S.cell,
    ),
    sc("%", S.cell),
    sc("100 − Realisation − Waste", S.cellLeft),
    ...Array(COLS - 4).fill(empty()),
  ]);
  rows.push([
    sc("Stock Waste", S.cellBoldLeft),
    sc(n(data.metrics?.totalStockWasteKg), S.cell),
    sc("kg", S.cell),
    sc("", S.cell),
    ...Array(COLS - 4).fill(empty()),
  ]);
  rows.push([
    sc("Avg Efficiency", S.cellBoldLeft),
    sc(n(avgEff), S.highlight),
    sc("%", S.cell),
    sc("SUM(ActualHK) / SUM(StdHK) × 100", S.cellLeft),
    ...Array(COLS - 4).fill(empty()),
  ]);

  rows.push(emptyRow(COLS));

  // ─ Energy Section ─
  rows.push(sectionRow("ENERGY CONSUMPTION", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("EB Units Consumed", S.cellBoldLeft),
    sc(n(data.energy?.ebUnitsConsumed), S.highlightAmber),
    empty(),
    empty(),
    ...Array(COLS - 4).fill(empty()),
  ]);
  rows.push([
    sc("UKG", S.cellBoldLeft),
    sc(n(data.energy?.ukg), S.highlight),
    sc("units/kg", S.cell),
    sc("EB Units / Gross Production", S.cellLeft),
    ...Array(COLS - 4).fill(empty()),
  ]);

  rows.push(emptyRow(COLS));
  rows.push(
    sectionRow(`Report generated: ${new Date().toLocaleString("en-IN")}`, COLS),
  );
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(
    wb,
    rows,
    "Monthly Realisation",
    [22, 16, 14, 14, 10, 10, 28],
    merges,
  );
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
  const {
    currentStock = [],
    lotWise = [],
    recentTransactions = [],
  } = data || {};

  rows.push(titleRow("SPINLYTICS — STOCK REPORT", COLS));
  rows.push(
    subtitleRow(`Generated: ${new Date().toLocaleDateString("en-IN")}`, COLS),
  );
  rows.push(emptyRow(COLS));

  // Current Stock
  rows.push(sectionRow("CURRENT STOCK SUMMARY", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Material", S.header),
    sc("Stock (Bags)", S.header),
    sc("Stock (kg)", S.header),
    sc("Value Status", S.header),
    ...Array(COLS - 4).fill(sc("", S.header)),
  ]);
  let totalStockKg = 0;
  currentStock.forEach((s) => {
    const kg = n(s.currentStockKg);
    totalStockKg += kg;
    rows.push([
      sc(s.materialType, S.cellBoldLeft),
      sc(n(s.currentStockBags), S.cell),
      sc(kg, S.cellBold),
      sc(
        kg > 0 ? "In Stock" : "Out of Stock",
        kg > 0 ? S.highlight : S.warning,
      ),
      ...Array(COLS - 4).fill(empty()),
    ]);
  });
  rows.push([
    sc("TOTAL", S.totalRow),
    sc("", S.totalRow),
    sc(totalStockKg, S.totalRow),
    sc("", S.totalRow),
    ...Array(COLS - 4).fill(sc("", S.totalRow)),
  ]);

  rows.push(emptyRow(COLS));

  // Lot-wise Stock
  rows.push(sectionRow("LOT-WISE STOCK BREAKDOWN", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Material", S.header),
    sc("Lot No", S.header),
    sc("Stock (kg)", S.header),
    ...Array(COLS - 3).fill(sc("", S.header)),
  ]);
  const sorted = [...lotWise].sort((a, b) =>
    a.materialType.localeCompare(b.materialType),
  );
  let prevMaterial = "";
  sorted.forEach((item) => {
    const isSameMaterial = item.materialType === prevMaterial;
    rows.push([
      sc(
        isSameMaterial ? "" : item.materialType,
        isSameMaterial ? S.cellLeft : S.cellBoldLeft,
      ),
      sc(item.lotNo, S.cellLeft),
      sc(n(item.kgs), S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    prevMaterial = item.materialType;
  });

  rows.push(emptyRow(COLS));

  // Recent Transactions
  rows.push(sectionRow("RECENT TRANSACTIONS (Last 20)", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Date", S.header),
    sc("Material", S.header),
    sc("Type", S.header),
    sc("Lot No", S.header),
    sc("Party", S.header),
    sc("Bags", S.header),
    sc("KG", S.header),
    sc("Price/Bag", S.header),
    sc("Remarks", S.header),
  ]);
  recentTransactions.forEach((txn) => {
    const isInflow = ["PURCHASE", "RETURN"].includes(txn.transactionType);
    const typeStyle = isInflow ? S.highlight : S.highlightAmber;
    rows.push([
      sc(new Date(txn.date).toLocaleDateString("en-IN"), S.cell),
      sc(txn.materialType, S.cellLeft),
      sc(txn.transactionType, typeStyle),
      sc(txn.lotNo, S.cellLeft),
      sc(txn.partyName, S.cellLeft),
      sc(n(txn.bags), S.cell),
      sc(n(txn.kgs), S.cell),
      sc(txn.pricePerBag ? n(txn.pricePerBag) : "—", S.cell),
      sc(txn.remarks || "—", S.cellLeft),
    ]);
  });

  addSheet(
    wb,
    rows,
    "Stock Report",
    [14, 14, 14, 14, 22, 12, 12, 12, 28],
    merges,
  );
  download(
    wb,
    `SpinLytics_Stock_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────
// REPORT: Material Movement Report
// ─────────────────────────────────────────────────────────────
export function exportMaterialMovement(data) {
  const wb = createWorkbook();
  const COLS = 9;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];
  const { recentTransactions = [] } = data || {};

  rows.push(titleRow("SPINLYTICS — MATERIAL MOVEMENT REPORT", COLS));
  rows.push(
    subtitleRow(`Generated: ${new Date().toLocaleDateString("en-IN")}`, COLS),
  );
  rows.push(emptyRow(COLS));

  // Movement summary by material type
  rows.push(sectionRow("MOVEMENT SUMMARY BY MATERIAL", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Material", S.header),
    sc("Inflow (PURCHASE)", S.header),
    sc("Inflow (RETURN)", S.header),
    sc("Total In (kg)", S.header),
    sc("Outflow (ISSUE)", S.header),
    sc("Outflow (DISPATCH)", S.header),
    sc("Total Out (kg)", S.header),
    sc("Net Movement (kg)", S.header),
    sc("", S.header),
  ]);

  const materialMap = {};
  recentTransactions.forEach((txn) => {
    const mat = txn.materialType;
    if (!materialMap[mat]) {
      materialMap[mat] = { PURCHASE: 0, RETURN: 0, ISSUE: 0, DISPATCH: 0 };
    }
    materialMap[mat][txn.transactionType] =
      (materialMap[mat][txn.transactionType] || 0) + n(txn.kgs);
  });

  let grandTotalIn = 0;
  let grandTotalOut = 0;
  Object.keys(materialMap)
    .sort()
    .forEach((mat) => {
      const m = materialMap[mat];
      const totalIn = m.PURCHASE + m.RETURN;
      const totalOut = m.ISSUE + m.DISPATCH;
      const net = totalIn - totalOut;
      grandTotalIn += totalIn;
      grandTotalOut += totalOut;
      rows.push([
        sc(mat, S.cellBoldLeft),
        sc(m.PURCHASE, S.highlight),
        sc(m.RETURN, S.highlightBlue),
        sc(totalIn, S.cellBold),
        sc(m.ISSUE, S.highlightAmber),
        sc(m.DISPATCH, S.warning),
        sc(totalOut, S.cellBold),
        sc(net, net >= 0 ? S.highlight : S.warning),
        empty(),
      ]);
    });

  const grandNet = grandTotalIn - grandTotalOut;
  rows.push([
    sc("TOTAL", S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc(grandTotalIn, S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc(grandTotalOut, S.totalRow),
    sc(grandNet, S.totalRow),
    sc("", S.totalRow),
  ]);

  rows.push(emptyRow(COLS));

  // Full transaction log
  rows.push(sectionRow("TRANSACTION LOG", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Date", S.header),
    sc("Material", S.header),
    sc("Type", S.header),
    sc("Lot No", S.header),
    sc("Party", S.header),
    sc("Bags", S.header),
    sc("KG", S.header),
    sc("Price/Bag", S.header),
    sc("Remarks", S.header),
  ]);

  const sorted = [...recentTransactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  sorted.forEach((txn) => {
    const isInflow = ["PURCHASE", "RETURN"].includes(txn.transactionType);
    const typeStyle = isInflow ? S.highlight : S.highlightAmber;
    rows.push([
      sc(new Date(txn.date).toLocaleDateString("en-IN"), S.cell),
      sc(txn.materialType, S.cellLeft),
      sc(txn.transactionType, typeStyle),
      sc(txn.lotNo || "—", S.cellLeft),
      sc(txn.partyName || "—", S.cellLeft),
      sc(n(txn.bags), S.cell),
      sc(n(txn.kgs), S.cell),
      sc(txn.pricePerBag ? n(txn.pricePerBag) : "—", S.cell),
      sc(txn.remarks || "—", S.cellLeft),
    ]);
  });

  addSheet(
    wb,
    rows,
    "Material Movement",
    [14, 14, 16, 14, 22, 12, 12, 12, 28],
    merges,
  );
  download(
    wb,
    `SpinLytics_Material_Movement_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────
// REPORT 4: Yearly Summary Report (Enhanced)
// ─────────────────────────────────────────────────────────────
export function exportYearlySummary(data) {
  const wb = createWorkbook();
  const MONTHS = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const COLS = 10;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(
    titleRow(`SPINLYTICS — YEARLY REPORT ${data.year} (2026 Standard)`, COLS),
  );
  rows.push(emptyRow(COLS));

  // Monthly Production Breakdown
  rows.push(sectionRow("MONTHLY PRODUCTION BREAKDOWN", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Month", S.header),
    sc("Gross Prod (kg)", S.header),
    sc("Net Prod (kg)", S.header),
    sc("Avg Eff %", S.headerBlue),
    sc("Yarn Realisation %", S.header),
    sc("Waste %", S.headerAmber),
    sc("Invisible Loss %", S.headerRed),
    sc("UKG", S.header),
    sc("Days", S.header),
    sc("Avg/Day (kg)", S.header),
  ]);

  let yearTotalGross = 0,
    yearTotalNet = 0;
  (data.months || []).forEach((m) => {
    const gross = n(m.production?.totalGrossKgs);
    const net = n(m.production?.totalNetKgs);
    yearTotalGross += gross;
    yearTotalNet += net;
    if (gross === 0) return;
    const days = m.production?.daysRecorded || 1;
    rows.push([
      sc(MONTHS[m.month], S.cellBold),
      sc(gross, S.cell),
      sc(net, S.cell),
      sc(n(m.production?.avgEfficiency), S.highlight),
      sc(n(m.metrics?.yarnRealisationPercent), S.cell),
      sc(n(m.metrics?.wastePercent), S.cell),
      sc(
        n(m.metrics?.invisibleLossPercent),
        n(m.metrics?.invisibleLossPercent) > 3 ? S.warning : S.cell,
      ),
      sc(n(m.energy?.ukg), S.cell),
      sc(days, S.cell),
      sc((gross / days).toFixed(1), S.cell),
    ]);
  });

  rows.push([
    sc("TOTAL", S.totalRow),
    sc(yearTotalGross, S.totalRow),
    sc(yearTotalNet, S.totalRow),
    ...Array(COLS - 3).fill(sc("", S.totalRow)),
  ]);

  rows.push(emptyRow(COLS));

  // Yearly Aggregated KPIs
  rows.push(sectionRow("YEARLY KEY PERFORMANCE INDICATORS", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.headerAmber),
    sc("Value", S.headerAmber),
    sc("Unit", S.headerAmber),
    ...Array(COLS - 3).fill(sc("", S.headerAmber)),
  ]);
  rows.push([
    sc("Total Gross Production", S.cellBoldLeft),
    sc(yearTotalGross, S.highlight),
    sc("kg", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Total Net Production", S.cellBoldLeft),
    sc(yearTotalNet, S.highlightBlue),
    sc("kg", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Total Waste (Shift)", S.cellBoldLeft),
    sc((yearTotalGross - yearTotalNet).toFixed(1), S.highlightAmber),
    sc("kg", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Net Yield", S.cellBoldLeft),
    sc(
      yearTotalGross > 0
        ? ((yearTotalNet / yearTotalGross) * 100).toFixed(1)
        : 0,
      S.highlightPurple,
    ),
    sc("%", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);

  // Active months and averages
  const activeMonths = (data.months || []).filter(
    (m) => n(m.production?.totalGrossKgs) > 0,
  );
  const totalDays = activeMonths.reduce(
    (s, m) => s + (m.production?.daysRecorded || 0),
    0,
  );
  rows.push([
    sc("Active Months", S.cellBoldLeft),
    sc(activeMonths.length, S.cell),
    sc("/ 12", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Total Working Days", S.cellBoldLeft),
    sc(totalDays, S.cell),
    sc("days", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg Monthly Production", S.cellBoldLeft),
    sc(
      activeMonths.length > 0
        ? (yearTotalGross / activeMonths.length).toFixed(0)
        : 0,
      S.highlight,
    ),
    sc("kg/month", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg Daily Production", S.cellBoldLeft),
    sc(totalDays > 0 ? (yearTotalGross / totalDays).toFixed(1) : 0, S.cell),
    sc("kg/day", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);

  rows.push(emptyRow(COLS));

  // Energy section
  const yearEB = activeMonths.reduce(
    (s, m) => s + n(m.energy?.ebUnitsConsumed),
    0,
  );
  rows.push(sectionRow("ENERGY CONSUMPTION (YEARLY)", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.headerAmber),
    sc("Value", S.headerAmber),
    sc("Unit", S.headerAmber),
    ...Array(COLS - 3).fill(sc("", S.headerAmber)),
  ]);
  rows.push([
    sc("Total EB Consumed", S.cellBoldLeft),
    sc(yearEB, S.highlightAmber),
    sc("units", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg UKG (Year)", S.cellBoldLeft),
    sc(
      yearTotalGross > 0 ? (yearEB / yearTotalGross).toFixed(4) : 0,
      S.highlight,
    ),
    sc("units/kg", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg Monthly EB", S.cellBoldLeft),
    sc(
      activeMonths.length > 0 ? (yearEB / activeMonths.length).toFixed(0) : 0,
      S.cell,
    ),
    sc("units/month", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);

  rows.push(emptyRow(COLS));

  // Raw Materials section
  const yrCotton = activeMonths.reduce(
    (s, m) => s + n(m.rawMaterials?.cottonIssueKg),
    0,
  );
  const yrFiber = activeMonths.reduce(
    (s, m) => s + n(m.rawMaterials?.fiberIssueKg),
    0,
  );
  const yrViscose = activeMonths.reduce(
    (s, m) => s + n(m.rawMaterials?.viscoseIssueKg),
    0,
  );
  const yrExcel = activeMonths.reduce(
    (s, m) => s + n(m.rawMaterials?.excelIssueKg),
    0,
  );
  const yrTotalCI = yrCotton + yrFiber + yrViscose + yrExcel;
  if (yrTotalCI > 0) {
    rows.push(sectionRow("RAW MATERIAL ISSUE (YEARLY)", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Material", S.header),
      sc("Total (kg)", S.header),
      sc("Share %", S.header),
      ...Array(COLS - 3).fill(sc("", S.header)),
    ]);
    rows.push([
      sc("Cotton", S.cellBoldLeft),
      sc(yrCotton, S.cell),
      sc(((yrCotton / yrTotalCI) * 100).toFixed(1), S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("Fiber", S.cellBoldLeft),
      sc(yrFiber, S.cell),
      sc(((yrFiber / yrTotalCI) * 100).toFixed(1), S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("Viscose", S.cellBoldLeft),
      sc(yrViscose, S.cell),
      sc(((yrViscose / yrTotalCI) * 100).toFixed(1), S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("Excel", S.cellBoldLeft),
      sc(yrExcel, S.cell),
      sc(((yrExcel / yrTotalCI) * 100).toFixed(1), S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("TOTAL", S.totalRow),
      sc(yrTotalCI, S.totalRow),
      sc("100%", S.totalRow),
      ...Array(COLS - 3).fill(sc("", S.totalRow)),
    ]);

    rows.push(emptyRow(COLS));
    rows.push([
      sc("Yarn Realisation (Year)", S.cellBoldLeft),
      sc(((yearTotalGross / yrTotalCI) * 100).toFixed(2), S.highlight),
      sc("%", S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    const yrWaste = activeMonths.reduce(
      (s, m) => s + n(m.metrics?.totalStockWasteKg),
      0,
    );
    rows.push([
      sc("Total Waste", S.cellBoldLeft),
      sc(yrWaste, S.highlightAmber),
      sc("kg", S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("Waste %", S.cellBoldLeft),
      sc(((yrWaste / yrTotalCI) * 100).toFixed(2), S.cell),
      sc("%", S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push(emptyRow(COLS));
  }

  // Best/Worst Month
  if (activeMonths.length > 1) {
    const sorted = [...activeMonths].sort(
      (a, b) => n(b.production?.totalGrossKgs) - n(a.production?.totalGrossKgs),
    );
    rows.push(sectionRow("PERFORMANCE HIGHLIGHTS", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Best Month (Prod)", S.cellBoldLeft),
      sc(MONTHS[sorted[0].month], S.highlight),
      sc(`${n(sorted[0].production?.totalGrossKgs).toFixed(0)} kg`, S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("Lowest Month (Prod)", S.cellBoldLeft),
      sc(MONTHS[sorted[sorted.length - 1].month], S.highlightAmber),
      sc(
        `${n(sorted[sorted.length - 1].production?.totalGrossKgs).toFixed(0)} kg`,
        S.cell,
      ),
      ...Array(COLS - 3).fill(empty()),
    ]);
    const ukgMonths = activeMonths
      .filter((m) => n(m.energy?.ukg) > 0)
      .sort((a, b) => n(a.energy?.ukg) - n(b.energy?.ukg));
    if (ukgMonths.length > 0) {
      rows.push([
        sc("Best UKG Month", S.cellBoldLeft),
        sc(MONTHS[ukgMonths[0].month], S.highlight),
        sc(`UKG: ${ukgMonths[0].energy?.ukg}`, S.cell),
        ...Array(COLS - 3).fill(empty()),
      ]);
      if (ukgMonths.length > 1)
        rows.push([
          sc("Worst UKG Month", S.cellBoldLeft),
          sc(MONTHS[ukgMonths[ukgMonths.length - 1].month], S.warning),
          sc(`UKG: ${ukgMonths[ukgMonths.length - 1].energy?.ukg}`, S.cell),
          ...Array(COLS - 3).fill(empty()),
        ]);
    }
  }

  rows.push(emptyRow(COLS));
  rows.push(
    sectionRow(`Report generated: ${new Date().toLocaleString("en-IN")}`, COLS),
  );
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(
    wb,
    rows,
    "Yearly Summary",
    [10, 16, 16, 12, 16, 12, 16, 10, 8, 12],
    merges,
  );
  download(wb, `SpinLytics_Yearly_${data.year}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 5: Shift Production Log (2026 Standard)
// ─────────────────────────────────────────────────────────────
export function exportProductionLog(entries, dateRange) {
  const wb = createWorkbook();
  const COLS = 13;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — SHIFT PRODUCTION LOG (2026)", COLS));
  rows.push(
    subtitleRow(
      dateRange || `All Entries (${entries?.length || 0} records)`,
      COLS,
    ),
  );
  rows.push(emptyRow(COLS));

  rows.push([
    sc("Date", S.header),
    sc("R/F No.", S.header),
    sc("Sider", S.header),
    sc("Count", S.header),
    sc("Actual HK", S.header),
    sc("Gross Kg", S.header),
    sc("Net Kg", S.header),
    sc("Waste Kg", S.headerAmber),
    sc("Waste %", S.headerAmber),
    sc("Efficiency %", S.headerBlue),
    sc("Wkd Spindles", S.header),
    sc("G/Spindle", S.headerPurple),
    sc("Stoppages", S.header),
  ]);

  let totGross = 0,
    totNet = 0,
    totWaste = 0,
    totActualHK = 0,
    totStdHK = 0;
  (entries || []).forEach((e) => {
    const c = e.calculated || {};
    const gross = n(c.productionKgsGross);
    const net = n(c.actualProductionKgs);
    const waste = n(e.wasteKgs);
    const eff = n(c.efficiencyPercent);
    totGross += gross;
    totNet += net;
    totWaste += waste;
    totActualHK += n(e.actualHK);
    totStdHK += n(e.stdHK);
    rows.push([
      sc(new Date(e.date).toLocaleDateString("en-IN"), S.cell),
      sc(e.rfNo, S.cellBold),
      sc(e.siderName, S.cellLeft),
      sc(e.count, S.highlight),
      sc(n(e.actualHK), S.cell),
      sc(gross, S.cell),
      sc(net, S.cell),
      sc(waste, S.cell),
      sc(n(c.wastePercent), n(c.wastePercent) > 5 ? S.warning : S.cell),
      sc(eff, eff < 80 ? S.warning : S.highlight),
      sc(n(c.workedSpindles), S.cell),
      sc(n(c.gramsPerSpindle), S.highlightPurple),
      sc(e.stoppages || "—", S.cellLeft),
    ]);
  });

  const avgEff =
    totStdHK > 0 ? ((totActualHK / totStdHK) * 100).toFixed(2) : "0";
  rows.push([
    sc("TOTAL", S.totalRow),
    sc("", S.totalRow),
    sc(`${entries?.length || 0} entries`, S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc(totGross, S.totalRow),
    sc(totNet, S.totalRow),
    sc(totWaste, S.totalRow),
    sc(
      totGross > 0 ? ((totWaste / totGross) * 100).toFixed(2) + "%" : "0%",
      S.totalRow,
    ),
    sc(`${avgEff}%`, S.totalRow),
    ...Array(COLS - 10).fill(sc("", S.totalRow)),
  ]);

  addSheet(
    wb,
    rows,
    "Production Log",
    [14, 10, 16, 10, 12, 12, 12, 12, 10, 12, 14, 12, 28],
    merges,
  );
  download(wb, `SpinLytics_Production_Log.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT: Energy (EB) Log Report
// ─────────────────────────────────────────────────────────────
const MONTH_NAMES_EB = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function exportEBReport(entries) {
  const wb = createWorkbook();
  const COLS = 6;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  const sorted = [...(entries || [])].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );

  rows.push(titleRow("SPINLYTICS — ENERGY (EB) LOG", COLS));
  rows.push(
    subtitleRow(`Generated: ${new Date().toLocaleDateString("en-IN")}`, COLS),
  );
  rows.push(emptyRow(COLS));

  // Summary KPIs
  const totalConsumed = sorted.reduce(
    (sum, e) => sum + (n(e.closingUnits) - n(e.openingUnits)),
    0,
  );
  const avgMonthly = sorted.length > 0 ? totalConsumed / sorted.length : 0;

  rows.push(sectionRow("SUMMARY", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.header),
    sc("Value", S.header),
    sc("Unit", S.header),
    ...Array(COLS - 3).fill(sc("", S.header)),
  ]);
  rows.push([
    sc("Total EB Consumed", S.cellBoldLeft),
    sc(totalConsumed, S.highlightAmber),
    sc("units", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Months Recorded", S.cellBoldLeft),
    sc(sorted.length, S.cell),
    sc("months", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg Monthly Consumption", S.cellBoldLeft),
    sc(avgMonthly.toFixed(0), S.highlight),
    sc("units/month", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push(emptyRow(COLS));

  // Monthly detail
  rows.push(sectionRow("MONTHLY EB DETAIL", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Month", S.header),
    sc("Year", S.header),
    sc("Opening Units", S.header),
    sc("Closing Units", S.header),
    sc("Consumed (Units)", S.headerAmber),
    sc("vs Avg", S.header),
  ]);

  sorted.forEach((e) => {
    const consumed = n(e.closingUnits) - n(e.openingUnits);
    const vsAvg = avgMonthly > 0 ? consumed - avgMonthly : 0;
    rows.push([
      sc(MONTH_NAMES_EB[e.month] || e.month, S.cellBoldLeft),
      sc(e.year, S.cell),
      sc(n(e.openingUnits), S.cell),
      sc(n(e.closingUnits), S.cell),
      sc(consumed, consumed > avgMonthly * 1.1 ? S.warning : S.highlightAmber),
      sc(
        (vsAvg >= 0 ? "+" : "") + vsAvg.toFixed(0),
        vsAvg > 0 ? S.warning : S.highlight,
      ),
    ]);
  });

  rows.push([
    sc("TOTAL", S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc(totalConsumed, S.totalRow),
    sc("", S.totalRow),
  ]);

  addSheet(wb, rows, "EB Log", [18, 10, 16, 16, 18, 14], merges);
  download(
    wb,
    `SpinLytics_EB_Log_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────
// REPORT: Dispatch Log Report
// ─────────────────────────────────────────────────────────────
export function exportDispatchLog(entries) {
  const wb = createWorkbook();
  const COLS = 9;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — DISPATCH LOG", COLS));
  rows.push(
    subtitleRow(`Generated: ${new Date().toLocaleDateString("en-IN")}`, COLS),
  );
  rows.push(emptyRow(COLS));

  // Summary by material
  const matMap = {};
  (entries || []).forEach((e) => {
    const mat = e.materialType || "UNKNOWN";
    if (!matMap[mat])
      matMap[mat] = { bags: 0, kgs: 0, totalPrice: 0, entries: 0 };
    matMap[mat].bags += n(e.bags);
    matMap[mat].kgs += n(e.kgs);
    matMap[mat].totalPrice += n(e.totalPrice);
    matMap[mat].entries++;
  });

  if (Object.keys(matMap).length > 0) {
    rows.push(sectionRow("SUMMARY BY MATERIAL", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Material", S.header),
      sc("Entries", S.header),
      sc("Total Bags", S.header),
      sc("Total KG", S.header),
      sc("Total Value (₹)", S.header),
      ...Array(COLS - 5).fill(sc("", S.header)),
    ]);
    Object.entries(matMap)
      .sort((a, b) => b[1].kgs - a[1].kgs)
      .forEach(([mat, d]) => {
        rows.push([
          sc(mat, S.cellBoldLeft),
          sc(d.entries, S.cell),
          sc(d.bags, S.cell),
          sc(d.kgs, S.cellBold),
          sc(
            d.totalPrice > 0 ? d.totalPrice : "—",
            d.totalPrice > 0 ? S.highlight : S.cell,
          ),
          ...Array(COLS - 5).fill(empty()),
        ]);
      });
    const grandBags = Object.values(matMap).reduce((s, d) => s + d.bags, 0);
    const grandKgs = Object.values(matMap).reduce((s, d) => s + d.kgs, 0);
    const grandValue = Object.values(matMap).reduce(
      (s, d) => s + d.totalPrice,
      0,
    );
    rows.push([
      sc("TOTAL", S.totalRow),
      sc((entries || []).length, S.totalRow),
      sc(grandBags, S.totalRow),
      sc(grandKgs, S.totalRow),
      sc(grandValue > 0 ? grandValue : "—", S.totalRow),
      ...Array(COLS - 5).fill(sc("", S.totalRow)),
    ]);
    rows.push(emptyRow(COLS));
  }

  // Detail log
  rows.push(sectionRow("DISPATCH ENTRIES DETAIL", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Date", S.header),
    sc("Material", S.header),
    sc("Lot No", S.header),
    sc("Party", S.header),
    sc("Bags", S.header),
    sc("KG", S.header),
    sc("Price/Bag (₹)", S.header),
    sc("Total Value (₹)", S.header),
    sc("Remarks", S.header),
  ]);

  (entries || []).forEach((e) => {
    rows.push([
      sc(new Date(e.date).toLocaleDateString("en-IN"), S.cell),
      sc(e.materialType, S.cellBoldLeft),
      sc(e.lotNo || "—", S.cellLeft),
      sc(e.partyName || "—", S.cellLeft),
      sc(n(e.bags), S.cell),
      sc(n(e.kgs), S.cellBold),
      sc(e.pricePerBag ? n(e.pricePerBag) : "—", S.cell),
      sc(
        e.totalPrice ? n(e.totalPrice) : "—",
        e.totalPrice ? S.highlight : S.cell,
      ),
      sc(e.remarks || "—", S.cellLeft),
    ]);
  });

  addSheet(
    wb,
    rows,
    "Dispatch Log",
    [14, 14, 14, 20, 10, 12, 14, 16, 28],
    merges,
  );
  download(
    wb,
    `SpinLytics_Dispatch_Log_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────
// REPORT: Packing Log Report
// ─────────────────────────────────────────────────────────────
export function exportPackingLog(entries) {
  const wb = createWorkbook();
  const COLS = 7;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — PACKING LOG", COLS));
  rows.push(
    subtitleRow(`Generated: ${new Date().toLocaleDateString("en-IN")}`, COLS),
  );
  rows.push(emptyRow(COLS));

  // Summary by source
  const sourceMap = {};
  (entries || []).forEach((e) => {
    const src = e.source || "UNKNOWN";
    if (!sourceMap[src]) sourceMap[src] = { bags: 0, kgs: 0, entries: 0 };
    sourceMap[src].bags += n(e.bags);
    sourceMap[src].kgs += n(e.kgs);
    sourceMap[src].entries++;
  });

  if (Object.keys(sourceMap).length > 0) {
    rows.push(sectionRow("SUMMARY BY SOURCE", COLS));
    merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
    rows.push([
      sc("Source", S.header),
      sc("Entries", S.header),
      sc("Total Bags", S.header),
      sc("Total KG", S.header),
      ...Array(COLS - 4).fill(sc("", S.header)),
    ]);
    Object.entries(sourceMap).forEach(([src, d]) => {
      rows.push([
        sc(src, S.cellBoldLeft),
        sc(d.entries, S.cell),
        sc(d.bags, S.cell),
        sc(d.kgs, S.cellBold),
        ...Array(COLS - 4).fill(empty()),
      ]);
    });
    const grandBags = Object.values(sourceMap).reduce((s, d) => s + d.bags, 0);
    const grandKgs = Object.values(sourceMap).reduce((s, d) => s + d.kgs, 0);
    rows.push([
      sc("TOTAL", S.totalRow),
      sc((entries || []).length, S.totalRow),
      sc(grandBags, S.totalRow),
      sc(grandKgs, S.totalRow),
      ...Array(COLS - 4).fill(sc("", S.totalRow)),
    ]);
    rows.push(emptyRow(COLS));
  }

  // Detail log
  rows.push(sectionRow("PACKING ENTRIES DETAIL", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Date", S.header),
    sc("Source", S.header),
    sc("Yarn Type", S.header),
    sc("Lot No", S.header),
    sc("Bags", S.header),
    sc("KG", S.header),
    sc("Remarks", S.header),
  ]);

  (entries || []).forEach((e) => {
    const isConer = e.source === "AUTOCONER";
    rows.push([
      sc(new Date(e.date).toLocaleDateString("en-IN"), S.cell),
      sc(e.source, isConer ? S.highlight : S.highlightBlue),
      sc(e.yarnType || "—", S.cellLeft),
      sc(e.lotNo || "—", S.cellLeft),
      sc(n(e.bags), S.cell),
      sc(n(e.kgs), S.cellBold),
      sc(e.remarks || "—", S.cellLeft),
    ]);
  });

  addSheet(wb, rows, "Packing Log", [14, 14, 16, 14, 10, 12, 28], merges);
  download(
    wb,
    `SpinLytics_Packing_Log_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────
// REPORT 11: Count-wise Production Analysis (2026 Standard)
// ─────────────────────────────────────────────────────────────
export function exportLossAnalysis(entries) {
  const wb = createWorkbook();
  const COLS = 10;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1)];

  rows.push(
    titleRow("SPINLYTICS — COUNT-WISE PRODUCTION ANALYSIS (2026)", COLS),
  );
  rows.push(emptyRow(COLS));

  // Group entries by count
  const countMap = {};
  (entries || []).forEach((e) => {
    const c = e.calculated || {};
    const count = e.count || "Unknown";
    if (!countMap[count])
      countMap[count] = {
        grossKgs: 0,
        netKgs: 0,
        wasteKgs: 0,
        actualHK: 0,
        stdHK: 0,
        entries: 0,
      };
    countMap[count].grossKgs += n(c.productionKgsGross);
    countMap[count].netKgs += n(c.actualProductionKgs);
    countMap[count].wasteKgs += n(e.wasteKgs);
    countMap[count].actualHK += n(e.actualHK);
    countMap[count].stdHK += n(e.stdHK);
    countMap[count].entries++;
  });

  rows.push(sectionRow("COUNT-WISE PRODUCTION OVERVIEW", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Count", S.header),
    sc("Entries", S.header),
    sc("Gross (kg)", S.header),
    sc("Net (kg)", S.header),
    sc("Waste (kg)", S.headerAmber),
    sc("Waste %", S.headerAmber),
    sc("Avg Eff %", S.headerBlue),
    sc("Share of Total", S.header),
    ...Array(COLS - 8).fill(sc("", S.header)),
  ]);

  const grandGross = Object.values(countMap).reduce(
    (s, c) => s + c.grossKgs,
    0,
  );

  Object.entries(countMap)
    .sort((a, b) => b[1].grossKgs - a[1].grossKgs)
    .forEach(([count, d]) => {
      const wastePct =
        d.grossKgs > 0 ? ((d.wasteKgs / d.grossKgs) * 100).toFixed(2) : "0";
      const effPct =
        d.stdHK > 0 ? ((d.actualHK / d.stdHK) * 100).toFixed(2) : "0";
      const share =
        grandGross > 0 ? ((d.grossKgs / grandGross) * 100).toFixed(1) : "0";
      rows.push([
        sc(count, S.cellBold),
        sc(d.entries, S.cell),
        sc(d.grossKgs, S.cell),
        sc(d.netKgs, S.cell),
        sc(d.wasteKgs, S.cell),
        sc(wastePct, n(wastePct) > 5 ? S.warning : S.cell),
        sc(effPct, n(effPct) < 80 ? S.warning : S.highlight),
        sc(`${share}%`, S.cell),
        ...Array(COLS - 8).fill(empty()),
      ]);
    });

  addSheet(
    wb,
    rows,
    "Count Analysis",
    [10, 10, 14, 14, 14, 12, 12, 14, 10, 10],
    merges,
  );
  download(wb, `SpinLytics_Count_Analysis.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 12: Weekly Production Summary (2026 Standard)
// ─────────────────────────────────────────────────────────────
export function exportWeeklyProduction(entries, dateRange) {
  const wb = createWorkbook();
  const COLS = 10;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — WEEKLY PRODUCTION SUMMARY (2026)", COLS));
  rows.push(subtitleRow(dateRange || "All Data", COLS));
  rows.push(emptyRow(COLS));

  // Group entries by week
  const weekMap = {};
  (entries || []).forEach((e) => {
    const c = e.calculated || {};
    const d = new Date(e.date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(
      ((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7,
    );
    const key = `W${weekNo} (${d.getFullYear()})`;
    if (!weekMap[key])
      weekMap[key] = {
        grossKgs: 0,
        netKgs: 0,
        wasteKgs: 0,
        actualHK: 0,
        stdHK: 0,
        days: new Set(),
        entries: 0,
      };
    weekMap[key].grossKgs += n(c.productionKgsGross);
    weekMap[key].netKgs += n(c.actualProductionKgs);
    weekMap[key].wasteKgs += n(e.wasteKgs);
    weekMap[key].actualHK += n(e.actualHK);
    weekMap[key].stdHK += n(e.stdHK);
    weekMap[key].days.add(new Date(e.date).toDateString());
    weekMap[key].entries++;
  });

  rows.push(sectionRow("WEEKLY BREAKDOWN", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Week", S.header),
    sc("Days", S.header),
    sc("Entries", S.header),
    sc("Gross (kg)", S.header),
    sc("Net (kg)", S.header),
    sc("Waste (kg)", S.headerAmber),
    sc("Waste %", S.headerAmber),
    sc("Avg Eff %", S.headerBlue),
    sc("Avg Prod/Day", S.header),
    sc("Net Yield %", S.header),
  ]);

  let totGross = 0,
    totNet = 0,
    totWaste = 0;
  Object.entries(weekMap).forEach(([week, d]) => {
    const wastePct =
      d.grossKgs > 0 ? ((d.wasteKgs / d.grossKgs) * 100).toFixed(2) : "0";
    const effPct =
      d.stdHK > 0 ? ((d.actualHK / d.stdHK) * 100).toFixed(2) : "0";
    const yieldPct =
      d.grossKgs > 0 ? ((d.netKgs / d.grossKgs) * 100).toFixed(1) : "0";
    const avgProdDay =
      d.days.size > 0 ? (d.grossKgs / d.days.size).toFixed(1) : "0";
    totGross += d.grossKgs;
    totNet += d.netKgs;
    totWaste += d.wasteKgs;
    rows.push([
      sc(week, S.cellBoldLeft),
      sc(d.days.size, S.cell),
      sc(d.entries, S.cell),
      sc(d.grossKgs, S.cellBold),
      sc(d.netKgs, S.cell),
      sc(d.wasteKgs, S.cell),
      sc(wastePct, n(wastePct) > 5 ? S.warning : S.cell),
      sc(effPct, S.highlight),
      sc(avgProdDay, S.highlight),
      sc(yieldPct, S.cell),
    ]);
  });

  rows.push([
    sc("TOTAL", S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc(totGross, S.totalRow),
    sc(totNet, S.totalRow),
    sc(totWaste, S.totalRow),
    sc(
      totGross > 0 ? ((totWaste / totGross) * 100).toFixed(2) + "%" : "",
      S.totalRow,
    ),
    ...Array(COLS - 7).fill(sc("", S.totalRow)),
  ]);

  rows.push(emptyRow(COLS));
  rows.push(
    sectionRow(`Report generated: ${new Date().toLocaleString("en-IN")}`, COLS),
  );
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(
    wb,
    rows,
    "Weekly Summary",
    [16, 8, 8, 14, 14, 14, 12, 12, 14, 12],
    merges,
  );
  download(wb, `SpinLytics_Weekly_Production.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// REPORT 13: Monthly Day-wise Detailed Report (2026 Standard)
// ─────────────────────────────────────────────────────────────
export function exportMonthlyDaywise(data, prodEntries) {
  const wb = createWorkbook();
  const MONTHS = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const COLS = 10;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — MONTHLY DAY-WISE PRODUCTION (2026)", COLS));
  rows.push(subtitleRow(`${MONTHS[data.month]} ${data.year}`, COLS));
  rows.push(emptyRow(COLS));

  // Aggregate by day from shift production entries
  const dayMap = {};
  (prodEntries || []).forEach((e) => {
    const c = e.calculated || {};
    const day = new Date(e.date).getDate();
    if (!dayMap[day])
      dayMap[day] = {
        grossKgs: 0,
        netKgs: 0,
        wasteKgs: 0,
        actualHK: 0,
        stdHK: 0,
        counts: new Set(),
        entries: 0,
      };
    dayMap[day].grossKgs += n(c.productionKgsGross);
    dayMap[day].netKgs += n(c.actualProductionKgs);
    dayMap[day].wasteKgs += n(e.wasteKgs);
    dayMap[day].actualHK += n(e.actualHK);
    dayMap[day].stdHK += n(e.stdHK);
    dayMap[day].counts.add(e.count);
    dayMap[day].entries++;
  });

  rows.push(sectionRow("DAY-BY-DAY PRODUCTION DATA", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Day", S.header),
    sc("Counts", S.header),
    sc("Entries", S.header),
    sc("Gross (kg)", S.header),
    sc("Net (kg)", S.header),
    sc("Waste (kg)", S.headerAmber),
    sc("Waste %", S.headerAmber),
    sc("Avg Eff %", S.headerBlue),
    sc("Avg Prod/Entry", S.header),
    sc("Net Yield %", S.header),
  ]);

  let totGross = 0,
    totNet = 0,
    totWaste = 0,
    totActHK = 0,
    totStdHK = 0;
  const lastDay = new Date(data.year, data.month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const day = dayMap[d];
    if (!day) {
      rows.push([
        sc(d, S.cell),
        sc("—", S.cell),
        ...Array(COLS - 2).fill(sc("—", S.cell)),
      ]);
      continue;
    }
    const wastePct =
      day.grossKgs > 0 ? ((day.wasteKgs / day.grossKgs) * 100).toFixed(2) : "0";
    const effPct =
      day.stdHK > 0 ? ((day.actualHK / day.stdHK) * 100).toFixed(2) : "0";
    const yieldPct =
      day.grossKgs > 0 ? ((day.netKgs / day.grossKgs) * 100).toFixed(1) : "0";
    const avgProd =
      day.entries > 0 ? (day.grossKgs / day.entries).toFixed(2) : "0";
    totGross += day.grossKgs;
    totNet += day.netKgs;
    totWaste += day.wasteKgs;
    totActHK += day.actualHK;
    totStdHK += day.stdHK;
    rows.push([
      sc(d, S.cellBold),
      sc(Array.from(day.counts).join(", "), S.cell),
      sc(day.entries, S.cell),
      sc(day.grossKgs, S.cellBold),
      sc(day.netKgs, S.cell),
      sc(day.wasteKgs, S.cell),
      sc(wastePct, n(wastePct) > 5 ? S.warning : S.cell),
      sc(effPct, n(effPct) < 80 ? S.warning : S.highlight),
      sc(avgProd, S.cell),
      sc(yieldPct, S.cell),
    ]);
  }

  const grandEffPct =
    totStdHK > 0 ? ((totActHK / totStdHK) * 100).toFixed(2) : "0";
  rows.push([
    sc("TOTAL", S.totalRow),
    sc("", S.totalRow),
    sc("", S.totalRow),
    sc(totGross, S.totalRow),
    sc(totNet, S.totalRow),
    sc(totWaste, S.totalRow),
    sc(
      totGross > 0 ? ((totWaste / totGross) * 100).toFixed(2) + "%" : "",
      S.totalRow,
    ),
    sc(`${grandEffPct}%`, S.totalRow),
    ...Array(COLS - 8).fill(sc("", S.totalRow)),
  ]);

  rows.push(emptyRow(COLS));

  // Summary statistics
  const activeDays = Object.keys(dayMap).length;
  rows.push(sectionRow("MONTHLY SUMMARY", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.headerAmber),
    sc("Value", S.headerAmber),
    sc("Unit", S.headerAmber),
    ...Array(COLS - 3).fill(sc("", S.headerAmber)),
  ]);
  rows.push([
    sc("Active Production Days", S.cellBoldLeft),
    sc(activeDays, S.highlight),
    sc("days", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Total Calendar Days", S.cellBoldLeft),
    sc(lastDay, S.cell),
    sc("days", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Utilization", S.cellBoldLeft),
    sc(((activeDays / lastDay) * 100).toFixed(0), S.highlightBlue),
    sc("%", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg Daily Production", S.cellBoldLeft),
    sc(activeDays > 0 ? (totGross / activeDays).toFixed(1) : 0, S.highlight),
    sc("kg/day", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);
  rows.push([
    sc("Avg Efficiency", S.cellBoldLeft),
    sc(grandEffPct, S.highlight),
    sc("%", S.cell),
    ...Array(COLS - 3).fill(empty()),
  ]);

  // Best/worst day
  const dayEntries = Object.entries(dayMap);
  if (dayEntries.length > 1) {
    const sorted = [...dayEntries].sort(
      (a, b) => b[1].grossKgs - a[1].grossKgs,
    );
    rows.push(emptyRow(COLS));
    rows.push([
      sc("Best Day (Production)", S.cellBoldLeft),
      sc(`Day ${sorted[0][0]}`, S.highlight),
      sc(`${sorted[0][1].grossKgs.toFixed(1)} kg`, S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
    rows.push([
      sc("Lowest Day (Production)", S.cellBoldLeft),
      sc(`Day ${sorted[sorted.length - 1][0]}`, S.highlightAmber),
      sc(`${sorted[sorted.length - 1][1].grossKgs.toFixed(1)} kg`, S.cell),
      ...Array(COLS - 3).fill(empty()),
    ]);
  }

  rows.push(emptyRow(COLS));
  rows.push(
    sectionRow(`Report generated: ${new Date().toLocaleString("en-IN")}`, COLS),
  );
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(
    wb,
    rows,
    "Day-wise Production",
    [6, 14, 8, 14, 14, 14, 12, 12, 14, 12],
    merges,
  );
  download(
    wb,
    `SpinLytics_Monthly_Daywise_${MONTHS[data.month]}_${data.year}.xlsx`,
  );
}

// ─────────────────────────────────────────────────────────────
// REPORT 14: Count Comparison Report (2026 Standard)
// ─────────────────────────────────────────────────────────────
export function exportCountComparison(entries, dateRange) {
  const wb = createWorkbook();
  const COLS = 9;
  const rows = [];
  const merges = [merge(0, 0, 0, COLS - 1), merge(1, 0, 1, COLS - 1)];

  rows.push(titleRow("SPINLYTICS — COUNT COMPARISON REPORT (2026)", COLS));
  rows.push(subtitleRow(dateRange || "All Data", COLS));
  rows.push(emptyRow(COLS));

  // Group entries by count
  const countMap = {};
  (entries || []).forEach((e) => {
    const c = e.calculated || {};
    const count = e.count || "Unknown";
    if (!countMap[count])
      countMap[count] = {
        grossKgs: 0,
        netKgs: 0,
        wasteKgs: 0,
        actualHK: 0,
        stdHK: 0,
        entries: 0,
      };
    countMap[count].grossKgs += n(c.productionKgsGross);
    countMap[count].netKgs += n(c.actualProductionKgs);
    countMap[count].wasteKgs += n(e.wasteKgs);
    countMap[count].actualHK += n(e.actualHK);
    countMap[count].stdHK += n(e.stdHK);
    countMap[count].entries++;
  });

  const grandGross = Object.values(countMap).reduce(
    (s, c) => s + c.grossKgs,
    0,
  );
  const counts = Object.keys(countMap).sort();

  rows.push(sectionRow("COUNT COMPARISON OVERVIEW", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.header),
    ...counts.map((c) => sc(c, S.header)),
    sc("Total", S.header),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(sc("", S.header)),
  ]);

  // Gross Production row
  rows.push([
    sc("Gross Production (kg)", S.cellBoldLeft),
    ...counts.map((c) => sc(countMap[c].grossKgs, S.cell)),
    sc(grandGross, S.cellBold),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  // Net Production row
  const grandNet = Object.values(countMap).reduce((s, c) => s + c.netKgs, 0);
  rows.push([
    sc("Net Production (kg)", S.cellBoldLeft),
    ...counts.map((c) => sc(countMap[c].netKgs, S.cell)),
    sc(grandNet, S.cellBold),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  // Waste row
  const grandWaste = Object.values(countMap).reduce(
    (s, c) => s + c.wasteKgs,
    0,
  );
  rows.push([
    sc("Waste (kg)", S.cellBoldLeft),
    ...counts.map((c) => sc(countMap[c].wasteKgs, S.highlightAmber)),
    sc(grandWaste, S.cellBold),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  // Share % row
  rows.push([
    sc("Share of Total %", S.cellBoldLeft),
    ...counts.map((c) =>
      sc(
        grandGross > 0
          ? ((countMap[c].grossKgs / grandGross) * 100).toFixed(1)
          : "0",
        S.highlight,
      ),
    ),
    sc("100%", S.cellBold),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  rows.push(emptyRow(COLS));

  // Efficiency comparison
  rows.push(sectionRow("EFFICIENCY COMPARISON", COLS));
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));
  rows.push([
    sc("Metric", S.headerAmber),
    ...counts.map((c) => sc(c, S.headerAmber)),
    sc("Best", S.headerAmber),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(sc("", S.headerAmber)),
  ]);

  // Waste % row
  const wastePcts = counts.map((c) =>
    countMap[c].grossKgs > 0
      ? (countMap[c].wasteKgs / countMap[c].grossKgs) * 100
      : 0,
  );
  const bestWaste = counts[wastePcts.indexOf(Math.min(...wastePcts))];
  rows.push([
    sc("Waste %", S.cellBoldLeft),
    ...wastePcts.map((w, i) => sc(w.toFixed(2), w > 5 ? S.warning : S.cell)),
    sc(`${bestWaste} ✓`, S.highlight),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  // Efficiency % row
  const effPcts = counts.map((c) =>
    countMap[c].stdHK > 0
      ? (countMap[c].actualHK / countMap[c].stdHK) * 100
      : 0,
  );
  const bestEff = counts[effPcts.indexOf(Math.max(...effPcts))];
  rows.push([
    sc("Avg Efficiency %", S.cellBoldLeft),
    ...effPcts.map((e) => sc(e.toFixed(2), e < 80 ? S.warning : S.highlight)),
    sc(`${bestEff} ✓`, S.highlight),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  // Entries row
  rows.push([
    sc("Total Entries", S.cellBoldLeft),
    ...counts.map((c) => sc(countMap[c].entries, S.cell)),
    sc(
      Object.values(countMap).reduce((s, c) => s + c.entries, 0),
      S.cellBold,
    ),
    ...Array(Math.max(0, COLS - counts.length - 2)).fill(empty()),
  ]);

  rows.push(emptyRow(COLS));
  rows.push(
    sectionRow(`Report generated: ${new Date().toLocaleString("en-IN")}`, COLS),
  );
  merges.push(merge(rows.length - 1, 0, rows.length - 1, COLS - 1));

  addSheet(
    wb,
    rows,
    "Count Comparison",
    [18, 14, 14, 14, 14, 14, 12, 10, 10],
    merges,
  );
  download(wb, `SpinLytics_Count_Comparison.xlsx`);
}

// Legacy alias for backwards compatibility
export const exportFrameComparison = exportCountComparison;
