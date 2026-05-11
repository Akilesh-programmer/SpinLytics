import {
  CalendarDays,
  Factory,
  TrendingDown,
  Zap,
  Gauge,
  BarChart3,
  Layers,
  Leaf,
  FlaskConical,
  Eye,
  Package,
  Scale,
  Percent,
  Clock,
  Activity,
  ArrowDown,
  Award,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import { useDateNavigation } from "../hooks/useDateNavigation";
import { dashboardApi } from "../api/dashboard";
import { shiftProductionApi } from "../api/shiftProduction";
import KPICard from "../components/common/KPICard";
import DatePicker from "../components/common/DatePicker";
import Loader from "../components/common/Loader";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import ProductionBarChart from "../components/charts/ProductionBarChart";
import MetricsDonut from "../components/charts/MetricsDonut";
import TrendLineChart from "../components/charts/TrendLineChart";
import DataTable from "../components/common/DataTable";
import ExportButton from "../components/common/ExportButton";
import { exportMonthlyRealisation } from "../utils/excelExport";
import "./MonthlyDashboard.css";

export default function MonthlyDashboard() {
  const nav = useDateNavigation("month");
  const { data, loading, error, refetch } = useApi(
    () => dashboardApi.getMonthlySummary(nav.year, nav.month),
    [nav.year, nav.month],
  );

  // Fetch daily shift production for trend charts
  const startDate = `${nav.year}-${String(nav.month).padStart(2, "0")}-01`;
  const lastDay = new Date(nav.year, nav.month, 0).getDate();
  const endDate = `${nav.year}-${String(nav.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: prodData } = useApi(
    () => shiftProductionApi.getAll({ startDate, endDate, limit: 500 }),
    [startDate, endDate],
  );

  if (loading)
    return (
      <div className="page-container">
        <Loader text="Loading monthly data..." />
      </div>
    );
  if (error)
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );

  const { production, rawMaterials, metrics, energy } = data || {};

  if (!production || Number(production.totalGrossKgs) === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            <CalendarDays size={24} /> Monthly Dashboard
          </h1>
          <DatePicker
            label={nav.displayLabel}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            onToday={nav.goToday}
            todayLabel="This Month"
          />
        </div>
        <EmptyState
          message="No production data for this month"
          sub="Try selecting a different month"
        />
      </div>
    );
  }

  const totalGross = parseFloat(production.totalGrossKgs);
  const totalNet = parseFloat(production.totalNetKgs);
  const totalShiftWaste = parseFloat(production.totalShiftWasteKgs || 0);
  const daysRecorded = production.daysRecorded || 1;
  const avgDailyProd = totalGross / daysRecorded;
  const cottonIssue = parseFloat(rawMaterials?.totalCottonIssueKg || 0);
  const stockWaste = parseFloat(metrics?.totalStockWasteKg || 0);
  const countBreakdown = production.countBreakdown || [];

  // Bar chart: count-wise production
  const barChartData = countBreakdown.map((cb) => ({
    name: cb.count,
    gross: parseFloat(cb.grossKgs),
    net: parseFloat(cb.netKgs),
  }));

  // Daily production trend from shift entries
  const dailyTrend = [];
  if (prodData?.data) {
    const dayMap = {};
    for (const entry of prodData.data) {
      const day = new Date(entry.date).getDate();
      if (!dayMap[day])
        dayMap[day] = {
          name: `${day}`,
          grossKgs: 0,
          netKgs: 0,
          wasteKgs: 0,
          actualHKSum: 0,
          stdHKSum: 0,
        };
      const gross = parseFloat(
        entry.calculated?.productionKgsGross ||
          entry.actualHK * entry.stdConstant ||
          0,
      );
      const waste = parseFloat(entry.wasteKgs || 0);
      dayMap[day].grossKgs += gross;
      dayMap[day].netKgs += gross - waste;
      dayMap[day].wasteKgs += waste;
      dayMap[day].actualHKSum += parseFloat(entry.actualHK || 0);
      dayMap[day].stdHKSum += parseFloat(entry.stdHK || 0);
    }
    for (let d = 1; d <= lastDay; d++) {
      const dm = dayMap[d];
      if (dm) {
        dm.avgEfficiency =
          dm.stdHKSum > 0 ? (dm.actualHKSum / dm.stdHKSum) * 100 : 0;
      }
      dailyTrend.push(
        dm || {
          name: `${d}`,
          grossKgs: 0,
          netKgs: 0,
          wasteKgs: 0,
          avgEfficiency: 0,
        },
      );
    }
  }

  // Daily table data
  const dailyTableData = dailyTrend.map((d, i) => ({
    id: i,
    day: d.name,
    grossKgs: d.grossKgs.toFixed(1),
    netKgs: d.netKgs.toFixed(1),
    wasteKgs: d.wasteKgs.toFixed(1),
    wastePct:
      d.grossKgs > 0 ? ((d.wasteKgs / d.grossKgs) * 100).toFixed(1) : "0",
    yieldPct:
      d.grossKgs > 0 ? ((d.netKgs / d.grossKgs) * 100).toFixed(1) : "0",
    avgEfficiency: d.avgEfficiency ? d.avgEfficiency.toFixed(1) : "—",
  }));

  const dailyTableColumns = [
    { key: "day", label: "Day" },
    { key: "grossKgs", label: "Gross (kg)", align: "right" },
    { key: "netKgs", label: "Net (kg)", align: "right" },
    {
      key: "wasteKgs",
      label: "Waste (kg)",
      align: "right",
      render: (v) => <span style={{ color: "var(--accent-amber)" }}>{v}</span>,
    },
    {
      key: "wastePct",
      label: "Waste %",
      align: "right",
      render: (v) => <span style={{ color: "var(--accent-amber)" }}>{v}%</span>,
    },
    {
      key: "yieldPct",
      label: "Yield %",
      align: "right",
      render: (v) => <span style={{ color: "var(--accent-emerald)" }}>{v}%</span>,
    },
    {
      key: "avgEfficiency",
      label: "Avg Eff %",
      align: "right",
      render: (v) => <span style={{ color: "var(--accent-cyan)" }}>{v}%</span>,
    },
  ];

  return (
    <div className="page-container" id="monthly-dashboard">
      <div className="page-header">
        <h1 className="page-title">
          <CalendarDays size={24} /> Monthly Dashboard
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ExportButton
            label="Export Monthly"
            onClick={() => exportMonthlyRealisation(data)}
          />
          <DatePicker
            label={nav.displayLabel}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            onToday={nav.goToday}
            todayLabel="This Month"
          />
        </div>
      </div>

      {/* Row 1: Production KPIs */}
      <div className="monthly-section">
        <h3 className="section-title">
          <BarChart3 size={18} /> Production Summary
        </h3>
        <div className="grid-5">
          <KPICard
            label="Gross Production"
            value={totalGross.toFixed(1)}
            unit="kg"
            icon={Factory}
            color="teal"
            delay={0}
          />
          <KPICard
            label="Net Production"
            value={totalNet.toFixed(1)}
            unit="kg"
            icon={Factory}
            color="emerald"
            delay={1}
            sub="Gross − Waste"
          />
          <KPICard
            label="Shift Waste"
            value={totalShiftWaste.toFixed(1)}
            unit="kg"
            icon={TrendingDown}
            color="amber"
            delay={2}
            sub={`${production.shiftWastePercent}%`}
          />
          <KPICard
            label="Avg Efficiency"
            value={production.avgEfficiency || "0"}
            unit="%"
            icon={Gauge}
            color="cyan"
            delay={3}
            sub="Actual HK / STD HK"
          />
          <KPICard
            label="Overall Yield"
            value={production.overallYieldPercent || "0"}
            unit="%"
            icon={Percent}
            color="blue"
            delay={4}
            sub="Net / Gross × 100"
          />
        </div>
        <div className="grid-4" style={{ marginTop: '12px' }}>
          <KPICard
            label="Avg Daily"
            value={avgDailyProd.toFixed(1)}
            unit="kg/day"
            icon={Scale}
            color="purple"
            delay={5}
            sub={`${daysRecorded} days recorded`}
          />
          <KPICard
            label="Total Lost"
            value={Number(production.totalLostKg || 0).toFixed(1)}
            unit="kg"
            icon={ArrowDown}
            color="red"
            delay={6}
            sub="Gross − Net"
          />
          <KPICard
            label="Total Packing"
            value={totalNet.toFixed(1)}
            unit="kg"
            icon={Package}
            color="emerald"
            delay={7}
            sub="Net Production = Packed Output"
          />
        </div>
        {production.hasAutocornerData && (
          <div className="grid-4" style={{ marginTop: '12px' }}>
            <KPICard label="Autocorner" value={Number(production.totalAutocornerKgs).toFixed(1)} unit="kg" icon={Layers} color="teal" sub="After spinning, before packing" />
            <KPICard label="Spinning Loss" value={`${production.spinningLossPercent}%`} icon={TrendingDown} color="amber" sub={`${Number(production.spinningLossKg).toFixed(1)} kg`} />
            <KPICard label="Autocorner Loss" value={`${production.autocornerLossPercent}%`} icon={TrendingDown} color="red" sub={`${Number(production.autocornerLossKg).toFixed(1)} kg`} />
          </div>
        )}
      </div>

      {/* Count-wise breakdown */}
      {countBreakdown.length > 0 && (
        <div className="monthly-section">
          <h3 className="section-title">
            <Activity size={18} /> Count-wise Breakdown
          </h3>
          <div className="grid-4">
            {countBreakdown.map((cb, i) => (
              <KPICard
                key={cb.count}
                label={`Count ${cb.count}`}
                value={Number(cb.grossKgs).toFixed(1)}
                unit="kg"
                icon={Factory}
                color={["teal", "blue", "purple", "cyan"][i % 4]}
                delay={5 + i}
                sub={`${cb.percentOfTotal}% of total • Eff: ${cb.avgEfficiency}%`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Energy */}
      <div className="monthly-section">
        <div className="grid-3">
          <KPICard
            label="UKG"
            value={energy?.ukg || "0"}
            icon={Gauge}
            color="purple"
            delay={10}
            sub="EB Units / Gross Production"
          />
          <KPICard
            label="EB Units"
            value={Number(energy?.ebUnitsConsumed || 0).toFixed(0)}
            icon={Zap}
            color="amber"
            delay={11}
          />
          <KPICard
            label="Days Recorded"
            value={daysRecorded}
            icon={Clock}
            color="blue"
            delay={12}
          />
        </div>
      </div>

      {/* Row 3: Raw Materials */}
      {rawMaterials && (
        <div className="monthly-section">
          <h3 className="section-title">
            <Layers size={18} /> Raw Materials Issued
          </h3>
          <div className="monthly-raw-grid">
            <div
              className="raw-material-card"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="raw-material-label">Cotton</div>
              <div className="raw-material-value">
                {Number(rawMaterials.cottonIssueKg).toFixed(1)}
                <span className="raw-material-unit">kg</span>
              </div>
            </div>
            <div
              className="raw-material-card"
              style={{ animationDelay: "0.15s" }}
            >
              <div className="raw-material-label">Fiber</div>
              <div className="raw-material-value">
                {Number(rawMaterials.fiberIssueKg).toFixed(1)}
                <span className="raw-material-unit">kg</span>
              </div>
            </div>
            <div
              className="raw-material-card"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="raw-material-label">Viscose</div>
              <div className="raw-material-value">
                {Number(rawMaterials.viscoseIssueKg).toFixed(1)}
                <span className="raw-material-unit">kg</span>
              </div>
            </div>
            <div
              className="raw-material-card"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="raw-material-label">Excel</div>
              <div className="raw-material-value">
                {Number(rawMaterials.excelIssueKg).toFixed(1)}
                <span className="raw-material-unit">kg</span>
              </div>
            </div>
            <div
              className="raw-material-card"
              style={{
                animationDelay: "0.3s",
                borderColor: "var(--accent-teal)",
                borderWidth: "1px",
              }}
            >
              <div className="raw-material-label">Total Cotton Issue</div>
              <div
                className="raw-material-value"
                style={{ color: "var(--accent-teal)" }}
              >
                {cottonIssue.toFixed(1)}
                <span className="raw-material-unit">kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Realisation & Waste */}
      <div className="monthly-section">
        <h3 className="section-title">
          <Eye size={18} /> Realisation & Waste Analysis
        </h3>
        <div className="grid-3">
          <KPICard
            label="Yarn Realisation"
            value={metrics?.yarnRealisationPercent || "0"}
            unit="%"
            icon={FlaskConical}
            color="teal"
            delay={13}
            sub="Gross Production / Cotton Issue"
          />
          <KPICard
            label="Waste"
            value={metrics?.wastePercent || "0"}
            unit="%"
            icon={Leaf}
            color="amber"
            delay={14}
            sub={`${stockWaste.toFixed(1)} kg stock waste`}
          />
          <KPICard
            label="Invisible Loss"
            value={metrics?.invisibleLossPercent || "0"}
            unit="%"
            icon={Eye}
            color="red"
            delay={15}
            sub="100 − Realisation − Waste"
          />
        </div>
        {metrics?.rawMaterialEfficiencyPercent && (
          <div className="grid-3" style={{ marginTop: '12px' }}>
            <KPICard
              label="Raw Material Efficiency"
              value={metrics.rawMaterialEfficiencyPercent}
              unit="%"
              icon={FlaskConical}
              color="emerald"
              delay={16}
              sub="Gross Prod / Cotton Issue × 100"
            />
          </div>
        )}
      </div>

      {/* Day Performance */}
      {data?.dayPerformance && (
        <div className="monthly-section">
          <h3 className="section-title">
            <Award size={18} /> Day Performance
          </h3>
          <div className="grid-3">
            <KPICard
              label="Best Day (Production)"
              value={new Date(data.dayPerformance.bestDay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              icon={Factory}
              color="emerald"
              sub={`${Number(data.dayPerformance.bestDay.grossKgs).toFixed(1)} kg`}
            />
            <KPICard
              label="Lowest Day"
              value={new Date(data.dayPerformance.lowestDay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              icon={ArrowDown}
              color="amber"
              sub={`${Number(data.dayPerformance.lowestDay.grossKgs).toFixed(1)} kg`}
            />
            <KPICard
              label="Best Efficiency Day"
              value={new Date(data.dayPerformance.bestEfficiencyDay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              icon={Gauge}
              color="cyan"
              sub={`${data.dayPerformance.bestEfficiencyDay.efficiency}%`}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="monthly-section">
        <div className="monthly-charts">
          <div>
            <h3 className="section-title">
              <BarChart3 size={18} /> Production by Count
            </h3>
            <ProductionBarChart data={barChartData} height={280} />
          </div>
          {metrics && (
            <div>
              <h3 className="section-title">
                <Eye size={18} /> Realisation Breakdown
              </h3>
              <MetricsDonut
                realisation={metrics.yarnRealisationPercent}
                waste={metrics.wastePercent}
                invisibleLoss={metrics.invisibleLossPercent}
                height={280}
              />
            </div>
          )}
        </div>
      </div>

      {/* Daily Production Trend */}
      {dailyTrend.length > 1 && (
        <div className="monthly-section">
          <h3 className="section-title">
            <BarChart3 size={18} /> Daily Production Trend
          </h3>
          <TrendLineChart
            data={dailyTrend}
            lines={[
              { key: "grossKgs", name: "Gross Production", color: "#00d4aa" },
              { key: "netKgs", name: "Net Production", color: "#3b82f6" },
              { key: "wasteKgs", name: "Waste", color: "#f59e0b" },
            ]}
            height={300}
          />
        </div>
      )}

      {/* Day-by-Day Table */}
      {dailyTableData.length > 0 && (
        <div className="monthly-section">
          <h3 className="section-title">
            <CalendarDays size={18} /> Day-by-Day Breakdown
          </h3>
          <DataTable
            columns={dailyTableColumns}
            data={dailyTableData}
            emptyMessage="No daily data"
          />
        </div>
      )}
    </div>
  );
}
