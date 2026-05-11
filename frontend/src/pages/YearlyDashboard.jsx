import {
  CalendarRange,
  Factory,
  BarChart3,
  TrendingDown,
  Zap,
  Gauge,
  Scale,
  Percent,
  Eye,
  Leaf,
  ArrowDown,
  Clock,
  Activity,
  Award,
  Package,
  Layers,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useDateNavigation } from "../hooks/useDateNavigation";
import { dashboardApi } from "../api/dashboard";
import KPICard from "../components/common/KPICard";
import DatePicker from "../components/common/DatePicker";
import DataTable from "../components/common/DataTable";
import Loader from "../components/common/Loader";
import ErrorState from "../components/common/ErrorState";
import ProductionBarChart from "../components/charts/ProductionBarChart";
import TrendLineChart from "../components/charts/TrendLineChart";
import ExportButton from "../components/common/ExportButton";
import { exportYearlySummary } from "../utils/excelExport";
import "./YearlyDashboard.css";

const MONTH_NAMES = [
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

export default function YearlyDashboard() {
  const nav = useDateNavigation("year");
  const { data, loading, error, refetch } = useApi(
    () => dashboardApi.getYearlySummary(nav.year),
    [nav.year],
  );

  if (loading)
    return (
      <div className="page-container">
        <Loader text="Loading yearly data..." />
      </div>
    );
  if (error)
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );

  const { months = [], yearlyTotals } = data || {};

  // Filter months with data
  const activeMonths = months.filter(
    (m) => Number(m.production?.totalGrossKgs || 0) > 0,
  );

  // Yearly aggregated metrics
  const yearlyGross = months.reduce(
    (s, m) => s + parseFloat(m.production?.totalGrossKgs || 0),
    0,
  );
  const yearlyNet = months.reduce(
    (s, m) => s + parseFloat(m.production?.totalNetKgs || 0),
    0,
  );
  const yearlyShiftWaste = months.reduce(
    (s, m) => s + parseFloat(m.production?.totalShiftWasteKgs || 0),
    0,
  );
  const totalDays = months.reduce(
    (s, m) => s + (m.production?.daysRecorded || 0),
    0,
  );
  const avgMonthlyProd =
    activeMonths.length > 0 ? yearlyGross / activeMonths.length : 0;
  const yearlyWastePct =
    yearlyGross > 0 ? ((yearlyShiftWaste / yearlyGross) * 100).toFixed(2) : "0";
  const yearlyYieldPct =
    yearlyGross > 0 ? ((yearlyNet / yearlyGross) * 100).toFixed(2) : "0";
  
  // Autocorner aggregation
  const yearlyAutocorner = months.reduce(
    (s, m) => s + parseFloat(m.production?.totalAutocornerKgs || 0), 0,
  );
  const hasYearlyAutocorner = months.some(m => m.production?.hasAutocornerData);
  const yearlySpinLossPct = hasYearlyAutocorner && yearlyGross > 0
    ? (((yearlyGross - yearlyAutocorner) / yearlyGross) * 100).toFixed(2) : null;
  const yearlyAutoLossPct = hasYearlyAutocorner && yearlyAutocorner > 0
    ? (((yearlyAutocorner - yearlyNet) / yearlyAutocorner) * 100).toFixed(2) : null;

  // Energy
  const yearlyEB = months.reduce(
    (s, m) => s + parseFloat(m.energy?.ebUnitsConsumed || 0),
    0,
  );
  const yearlyUKG = yearlyGross > 0 ? (yearlyEB / yearlyGross).toFixed(4) : "0";
  const ebMonths = activeMonths.filter(
    (m) => parseFloat(m.energy?.ebUnitsConsumed || 0) > 0,
  );
  const avgMonthlyEB = ebMonths.length > 0 ? yearlyEB / ebMonths.length : 0;

  // Raw Materials
  const yearlyCotton = months.reduce(
    (s, m) => s + parseFloat(m.rawMaterials?.cottonIssueKg || 0),
    0,
  );
  const yearlyFiber = months.reduce(
    (s, m) => s + parseFloat(m.rawMaterials?.fiberIssueKg || 0),
    0,
  );
  const yearlyViscose = months.reduce(
    (s, m) => s + parseFloat(m.rawMaterials?.viscoseIssueKg || 0),
    0,
  );
  const yearlyExcel = months.reduce(
    (s, m) => s + parseFloat(m.rawMaterials?.excelIssueKg || 0),
    0,
  );
  const yearlyTotalCottonIssue =
    yearlyCotton + yearlyFiber + yearlyViscose + yearlyExcel;

  // Realisation
  const yearlyStockWaste = months.reduce(
    (s, m) => s + parseFloat(m.metrics?.totalStockWasteKg || 0),
    0,
  );
  const yearlyRealisationPct =
    yearlyTotalCottonIssue > 0
      ? ((yearlyGross / yearlyTotalCottonIssue) * 100).toFixed(2)
      : "0";
  const yearlyWasteRptPct =
    yearlyTotalCottonIssue > 0
      ? ((yearlyStockWaste / yearlyTotalCottonIssue) * 100).toFixed(2)
      : "0";
  const yearlyInvLoss =
    yearlyTotalCottonIssue > 0
      ? (
          100 -
          parseFloat(yearlyRealisationPct) -
          parseFloat(yearlyWasteRptPct)
        ).toFixed(2)
      : "0";

  // Best / Worst
  const sortedByProd = [...activeMonths].sort(
    (a, b) =>
      parseFloat(b.production?.totalGrossKgs || 0) -
      parseFloat(a.production?.totalGrossKgs || 0),
  );
  const bestMonth = sortedByProd[0];
  const worstMonth = sortedByProd[sortedByProd.length - 1];

  // Best/Worst UKG months
  const ukgMonths = activeMonths.filter(
    (m) => parseFloat(m.energy?.ukg || 0) > 0,
  );
  const bestUkgMonth = ukgMonths.length > 0
    ? ukgMonths.reduce((a, b) => parseFloat(a.energy?.ukg || 999) < parseFloat(b.energy?.ukg || 999) ? a : b)
    : null;
  const worstUkgMonth = ukgMonths.length > 0
    ? ukgMonths.reduce((a, b) => parseFloat(a.energy?.ukg || 0) > parseFloat(b.energy?.ukg || 0) ? a : b)
    : null;

  // Charts
  const chartData = months.map((m, i) => ({
    name: MONTH_NAMES[i],
    gross: parseFloat(m.production?.totalGrossKgs || 0),
    net: parseFloat(m.production?.totalNetKgs || 0),
  }));

  const trendData = months.map((m, i) => ({
    name: MONTH_NAMES[i],
    ukg: parseFloat(m.energy?.ukg || 0),
    realisation: parseFloat(m.metrics?.yarnRealisationPercent || 0),
    waste: parseFloat(m.metrics?.wastePercent || 0),
    efficiency: parseFloat(m.production?.avgEfficiency || 0),
  }));

  // Table
  const tableData = months.map((m, i) => ({
    id: i,
    month: MONTH_NAMES[i],
    grossKgs: Number(m.production?.totalGrossKgs || 0).toFixed(1),
    netKgs: Number(m.production?.totalNetKgs || 0).toFixed(1),
    shiftWaste: Number(m.production?.totalShiftWasteKgs || 0).toFixed(1),
    yieldPct: m.production?.overallYieldPercent || "-",
    avgEfficiency: m.production?.avgEfficiency || "-",
    realisation: m.metrics?.yarnRealisationPercent || "-",
    waste: m.metrics?.wastePercent || "-",
    invisibleLoss: m.metrics?.invisibleLossPercent || "-",
    ukg: m.energy?.ukg || "-",
    ebUnits: Number(m.energy?.ebUnitsConsumed || 0).toFixed(0),
    days: m.production?.daysRecorded || 0,
  }));

  const columns = [
    { key: "month", label: "Month" },
    { key: "grossKgs", label: "Gross (kg)", align: "right" },
    { key: "netKgs", label: "Net (kg)", align: "right" },
    {
      key: "shiftWaste",
      label: "Waste (kg)",
      align: "right",
      render: (v) => <span style={{ color: "var(--accent-amber)" }}>{v}</span>,
    },
    {
      key: "yieldPct",
      label: "Yield %",
      align: "right",
      render: (v) =>
        v !== "-" ? (
          <span style={{ color: "var(--accent-emerald)" }}>{v}%</span>
        ) : (
          "-"
        ),
    },
    {
      key: "avgEfficiency",
      label: "Eff %",
      align: "right",
      render: (v) =>
        v !== "-" ? (
          <span style={{ color: "var(--accent-cyan)" }}>{v}%</span>
        ) : (
          "-"
        ),
    },
    {
      key: "realisation",
      label: "Realisation %",
      align: "right",
      render: (v) =>
        v !== "-" ? (
          <span style={{ color: "var(--accent-teal)" }}>{v}%</span>
        ) : (
          "-"
        ),
    },
    {
      key: "waste",
      label: "Waste %",
      align: "right",
      render: (v) =>
        v !== "-" ? (
          <span style={{ color: "var(--accent-amber)" }}>{v}%</span>
        ) : (
          "-"
        ),
    },
    {
      key: "invisibleLoss",
      label: "Inv Loss %",
      align: "right",
      render: (v) =>
        v !== "-" ? (
          <span style={{ color: "var(--accent-red)" }}>{v}%</span>
        ) : (
          "-"
        ),
    },
    { key: "ebUnits", label: "EB Units", align: "right" },
    { key: "ukg", label: "UKG", align: "right" },
    { key: "days", label: "Days", align: "center" },
  ];

  return (
    <div className="page-container" id="yearly-dashboard">
      <div className="page-header">
        <h1 className="page-title">
          <CalendarRange size={24} /> Yearly Dashboard
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ExportButton
            label="Export Yearly"
            onClick={() => exportYearlySummary(data)}
          />
          <DatePicker
            label={nav.displayLabel}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            onToday={nav.goToday}
            todayLabel="This Year"
          />
        </div>
      </div>

      {/* Annual Production */}
      <div style={{ marginBottom: "24px" }}>
        <h3 className="section-title">
          <Factory size={18} /> Annual Production
        </h3>
        <div className="grid-5">
          <KPICard
            label="Gross Production"
            value={yearlyGross.toFixed(0)}
            unit="kg"
            icon={Factory}
            color="teal"
            delay={0}
          />
          <KPICard
            label="Net Production"
            value={yearlyNet.toFixed(0)}
            unit="kg"
            icon={Factory}
            color="emerald"
            delay={1}
          />
          <KPICard
            label="Shift Waste"
            value={yearlyShiftWaste.toFixed(0)}
            unit="kg"
            icon={TrendingDown}
            color="amber"
            delay={2}
            sub={`${yearlyWastePct}%`}
          />
          <KPICard
            label="Avg Monthly"
            value={avgMonthlyProd.toFixed(0)}
            unit="kg/mo"
            icon={BarChart3}
            color="cyan"
            delay={3}
          />
          <KPICard
            label="Active Months"
            value={activeMonths.length}
            unit="/ 12"
            icon={CalendarRange}
            color="blue"
            delay={4}
          />
        </div>
        <div className="grid-4" style={{ marginTop: '12px' }}>
          <KPICard
            label="Overall Yield"
            value={yearlyYieldPct}
            unit="%"
            icon={Percent}
            color="emerald"
            delay={5}
            sub="Net / Gross × 100"
          />
          <KPICard
            label="Total Packing"
            value={yearlyNet.toFixed(0)}
            unit="kg"
            icon={Package}
            color="teal"
            delay={6}
            sub="Net Production = Packed Output"
          />
          <KPICard
            label="Total Lost"
            value={(yearlyGross - yearlyNet).toFixed(0)}
            unit="kg"
            icon={ArrowDown}
            color="red"
            delay={7}
            sub="Gross − Net"
          />
          <KPICard
            label="Total Days"
            value={totalDays}
            icon={Clock}
            color="blue"
            delay={8}
          />
        </div>
        {hasYearlyAutocorner && (
          <div className="grid-4" style={{ marginTop: '12px' }}>
            <KPICard label="Autocorner" value={yearlyAutocorner.toFixed(0)} unit="kg" icon={Layers} color="teal" sub="Total after spinning" />
            <KPICard label="Spinning Loss" value={`${yearlySpinLossPct}%`} icon={TrendingDown} color="amber" sub={`${(yearlyGross - yearlyAutocorner).toFixed(0)} kg`} />
            <KPICard label="Autocorner Loss" value={`${yearlyAutoLossPct}%`} icon={TrendingDown} color="red" sub={`${(yearlyAutocorner - yearlyNet).toFixed(0)} kg`} />
          </div>
        )}
      </div>

      {/* Energy */}
      <div style={{ marginBottom: "24px" }}>
        <h3 className="section-title">
          <Zap size={18} /> Energy Consumption
        </h3>
        <div className="grid-4">
          <KPICard
            label="Total EB Consumed"
            value={yearlyEB.toFixed(0)}
            unit="units"
            icon={Zap}
            color="amber"
            delay={5}
          />
          <KPICard
            label="Avg UKG (Year)"
            value={yearlyUKG}
            icon={Gauge}
            color="purple"
            delay={6}
            sub="EB / Gross Production"
          />
          <KPICard
            label="Avg Monthly EB"
            value={avgMonthlyEB.toFixed(0)}
            unit="units"
            icon={Zap}
            color="cyan"
            delay={7}
          />
          <KPICard
            label="Total Days"
            value={totalDays}
            icon={Clock}
            color="blue"
            delay={8}
          />
        </div>
      </div>

      {/* Realisation */}
      {yearlyTotalCottonIssue > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 className="section-title">
            <Eye size={18} /> Raw Material & Realisation
          </h3>
          <div className="grid-5">
            <KPICard
              label="Cotton Issued"
              value={yearlyCotton.toFixed(0)}
              unit="kg"
              icon={Leaf}
              color="teal"
              delay={9}
            />
            <KPICard
              label="Other Materials"
              value={(yearlyFiber + yearlyViscose + yearlyExcel).toFixed(0)}
              unit="kg"
              icon={Leaf}
              color="blue"
              delay={10}
            />
            <KPICard
              label="Yarn Realisation"
              value={yearlyRealisationPct}
              unit="%"
              icon={Eye}
              color="emerald"
              delay={11}
            />
            <KPICard
              label="Waste"
              value={yearlyWasteRptPct}
              unit="%"
              icon={Leaf}
              color="amber"
              delay={12}
              sub={`${yearlyStockWaste.toFixed(0)} kg`}
            />
            <KPICard
              label="Invisible Loss"
              value={yearlyInvLoss}
              unit="%"
              icon={Eye}
              color="red"
              delay={13}
            />
          </div>
        </div>
      )}

      {/* Highlights */}
      {bestMonth && worstMonth && activeMonths.length > 1 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 className="section-title">
            <BarChart3 size={18} /> Performance Highlights
          </h3>
          <div className="grid-4">
            <KPICard
              label="Best Month (Prod)"
              value={MONTH_NAMES[bestMonth.month - 1]}
              icon={Factory}
              color="emerald"
              sub={`${Number(bestMonth.production?.totalGrossKgs || 0).toFixed(0)} kg`}
            />
            <KPICard
              label="Lowest Month"
              value={MONTH_NAMES[worstMonth.month - 1]}
              icon={ArrowDown}
              color="amber"
              sub={`${Number(worstMonth.production?.totalGrossKgs || 0).toFixed(0)} kg`}
            />
            <KPICard
              label="Avg Daily (Year)"
              value={totalDays > 0 ? (yearlyGross / totalDays).toFixed(1) : "0"}
              unit="kg/day"
              icon={Scale}
              color="cyan"
            />
            <KPICard
              label="Total Lost"
              value={(yearlyGross - yearlyNet).toFixed(0)}
              unit="kg"
              icon={ArrowDown}
              color="red"
              sub="Gross − Net"
            />
          </div>
          {bestUkgMonth && worstUkgMonth && (
            <div className="grid-4" style={{ marginTop: '12px' }}>
              <KPICard
                label="Best UKG Month"
                value={MONTH_NAMES[bestUkgMonth.month - 1]}
                icon={Gauge}
                color="emerald"
                sub={`UKG: ${bestUkgMonth.energy?.ukg}`}
              />
              <KPICard
                label="Worst UKG Month"
                value={MONTH_NAMES[worstUkgMonth.month - 1]}
                icon={Gauge}
                color="amber"
                sub={`UKG: ${worstUkgMonth.energy?.ukg}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div style={{ marginBottom: "24px" }}>
        <h3 className="section-title">
          <BarChart3 size={18} /> Monthly Production Trend
        </h3>
        <ProductionBarChart data={chartData} height={320} />
      </div>

      {trendData.some((d) => d.efficiency > 0 || d.realisation > 0) && (
        <div style={{ marginBottom: "24px" }}>
          <h3 className="section-title">
            <Gauge size={18} /> Efficiency & Realisation Trends
          </h3>
          <TrendLineChart
            data={trendData}
            lines={[
              { key: "efficiency", name: "Avg Efficiency %", color: "#06b6d4" },
              { key: "realisation", name: "Realisation %", color: "#00d4aa" },
              { key: "waste", name: "Waste %", color: "#f59e0b" },
            ]}
            height={280}
          />
        </div>
      )}

      {/* Table */}
      <div className="yearly-table-wrapper">
        <h3 className="section-title">
          <CalendarRange size={18} /> Monthly Breakdown
        </h3>
        <DataTable
          columns={columns}
          data={tableData}
          emptyMessage="No data for this year"
        />
      </div>
    </div>
  );
}
