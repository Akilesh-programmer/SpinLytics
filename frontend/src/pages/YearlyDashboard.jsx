import {
  CalendarRange, Factory, BarChart3, TrendingDown, Zap, Gauge,
  Scale, Percent, Eye, Leaf, ArrowDown, Clock,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { dashboardApi } from '../api/dashboard';
import KPICard from '../components/common/KPICard';
import DatePicker from '../components/common/DatePicker';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import ProductionBarChart from '../components/charts/ProductionBarChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import ExportButton from '../components/common/ExportButton';
import { exportYearlySummary } from '../utils/excelExport';
import './YearlyDashboard.css';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function YearlyDashboard() {
  const nav = useDateNavigation('year');
  const { data, loading, error, refetch } = useApi(
    () => dashboardApi.getYearlySummary(nav.year),
    [nav.year]
  );

  if (loading) return <div className="page-container"><Loader text="Loading yearly data..." /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={refetch} /></div>;

  const { months = [], yearlyTotals } = data || {};

  // Filter months with data
  const activeMonths = months.filter(m => Number(m.production?.totalProductionKg || 0) > 0);

  // Compute yearly aggregated insights
  const yearlyProd = months.reduce((sum, m) => sum + parseFloat(m.production?.totalProductionKg || 0), 0);
  const yearlyFrame41 = months.reduce((sum, m) => sum + parseFloat(m.production?.frame41Kg || 0), 0);
  const yearlyFrame47 = months.reduce((sum, m) => sum + parseFloat(m.production?.frame47Kg || 0), 0);
  const yearlyPacking = months.reduce((sum, m) => sum + parseFloat(m.production?.totalPackingKg || 0), 0);
  const yearlyAutocorner = months.reduce((sum, m) => sum + parseFloat(m.production?.totalAutocornerKg || 0), 0);
  const totalDays = months.reduce((sum, m) => sum + (m.production?.daysRecorded || 0), 0);
  const avgMonthlyProd = activeMonths.length > 0 ? yearlyProd / activeMonths.length : 0;
  const yearlyOverallYield = yearlyProd > 0 ? ((yearlyPacking / yearlyProd) * 100).toFixed(1) : '0';
  const yearlySpinLoss = yearlyProd > 0 ? (((yearlyProd - yearlyAutocorner) / yearlyProd) * 100).toFixed(2) : '0';
  const yearlyAutoLoss = yearlyAutocorner > 0 ? (((yearlyAutocorner - yearlyPacking) / yearlyAutocorner) * 100).toFixed(2) : '0';

  // Yearly EB & Energy aggregations
  const yearlyEB = months.reduce((sum, m) => sum + parseFloat(m.energy?.ebUnitsConsumed || 0), 0);
  const yearlyUKG = yearlyProd > 0 ? (yearlyEB / yearlyProd).toFixed(4) : '0';
  const ebMonths = activeMonths.filter(m => parseFloat(m.energy?.ebUnitsConsumed || 0) > 0);
  const avgMonthlyEB = ebMonths.length > 0 ? yearlyEB / ebMonths.length : 0;

  // Yearly Raw Materials aggregation
  const yearlyCotton = months.reduce((sum, m) => sum + parseFloat(m.rawMaterials?.cottonIssueKg || 0), 0);
  const yearlyFiber = months.reduce((sum, m) => sum + parseFloat(m.rawMaterials?.fiberIssueKg || 0), 0);
  const yearlyViscose = months.reduce((sum, m) => sum + parseFloat(m.rawMaterials?.viscoseIssueKg || 0), 0);
  const yearlyExcel = months.reduce((sum, m) => sum + parseFloat(m.rawMaterials?.excelIssueKg || 0), 0);
  const yearlyTotalCottonIssue = yearlyCotton + yearlyFiber + yearlyViscose + yearlyExcel;

  // Yearly Realisation/Waste aggregation
  const yearlyWaste = months.reduce((sum, m) => sum + parseFloat(m.metrics?.totalWasteKg || 0), 0);
  const yearlyRealisationPct = yearlyTotalCottonIssue > 0 ? ((yearlyProd / yearlyTotalCottonIssue) * 100).toFixed(2) : '0';
  const yearlyWastePct = yearlyTotalCottonIssue > 0 ? ((yearlyWaste / yearlyTotalCottonIssue) * 100).toFixed(2) : '0';
  const yearlyInvisibleLossPct = yearlyTotalCottonIssue > 0 ? (100 - parseFloat(yearlyRealisationPct) - parseFloat(yearlyWastePct)).toFixed(2) : '0';

  // Best and worst months
  const sortedByProd = [...activeMonths].sort((a, b) => parseFloat(b.production?.totalProductionKg || 0) - parseFloat(a.production?.totalProductionKg || 0));
  const bestMonth = sortedByProd[0];
  const worstMonth = sortedByProd[sortedByProd.length - 1];

  // Best/worst UKG month
  const monthsWithUKG = activeMonths.filter(m => parseFloat(m.energy?.ukg || 0) > 0);
  const sortedByUKG = [...monthsWithUKG].sort((a, b) => parseFloat(a.energy?.ukg || 999) - parseFloat(b.energy?.ukg || 999));
  const bestUKGMonth = sortedByUKG[0];
  const worstUKGMonth = sortedByUKG[sortedByUKG.length - 1];

  // Production bar chart data
  const chartData = months.map((m, i) => ({
    name: MONTH_NAMES[i],
    frame41: parseFloat(m.production?.frame41Kg || 0),
    frame47: parseFloat(m.production?.frame47Kg || 0),
  }));

  // UKG + Realisation + Waste trend lines
  const ukgTrendData = months.map((m, i) => ({
    name: MONTH_NAMES[i],
    ukg: parseFloat(m.energy?.ukg || 0),
    realisation: parseFloat(m.metrics?.yarnRealisationPercent || 0),
    waste: parseFloat(m.metrics?.wastePercent || 0),
    invisibleLoss: parseFloat(m.metrics?.invisibleLossPercent || 0),
  }));

  // Prepare table data
  const tableData = months.map((m, i) => ({
    id: i,
    month: MONTH_NAMES[i],
    totalProduction: Number(m.production?.totalProductionKg || 0).toFixed(1),
    frame41: Number(m.production?.frame41Kg || 0).toFixed(1),
    frame47: Number(m.production?.frame47Kg || 0).toFixed(1),
    packing: Number(m.production?.totalPackingKg || 0).toFixed(1),
    spinningLoss: m.production?.spinningLossPercent || '-',
    autocornerLoss: m.production?.autocornerLossPercent || '-',
    realisation: m.metrics?.yarnRealisationPercent || '-',
    waste: m.metrics?.wastePercent || '-',
    invisibleLoss: m.metrics?.invisibleLossPercent || '-',
    ukg: m.energy?.ukg || '-',
    ebUnits: Number(m.energy?.ebUnitsConsumed || 0).toFixed(0),
    days: m.production?.daysRecorded || 0,
  }));

  const columns = [
    { key: 'month', label: 'Month' },
    { key: 'totalProduction', label: 'Total (kg)', align: 'right' },
    { key: 'frame41', label: 'F41 (kg)', align: 'right' },
    { key: 'frame47', label: 'F47 (kg)', align: 'right' },
    { key: 'packing', label: 'Packing (kg)', align: 'right' },
    { key: 'spinningLoss', label: 'Spin Loss %', align: 'right', render: (v) => v !== '-' ? <span style={{ color: 'var(--accent-amber)' }}>{v}%</span> : '-' },
    { key: 'autocornerLoss', label: 'Auto Loss %', align: 'right', render: (v) => v !== '-' ? <span style={{ color: 'var(--accent-red)' }}>{v}%</span> : '-' },
    { key: 'realisation', label: 'Realisation %', align: 'right', render: (v) => v !== '-' ? <span style={{ color: 'var(--accent-teal)' }}>{v}%</span> : '-' },
    { key: 'waste', label: 'Waste %', align: 'right', render: (v) => v !== '-' ? <span style={{ color: 'var(--accent-amber)' }}>{v}%</span> : '-' },
    { key: 'invisibleLoss', label: 'Inv Loss %', align: 'right', render: (v) => v !== '-' ? <span style={{ color: 'var(--accent-red)' }}>{v}%</span> : '-' },
    { key: 'ebUnits', label: 'EB Units', align: 'right' },
    { key: 'ukg', label: 'UKG', align: 'right' },
    { key: 'days', label: 'Days', align: 'center' },
  ];

  return (
    <div className="page-container" id="yearly-dashboard">
      <div className="page-header">
        <h1 className="page-title"><CalendarRange size={24} /> Yearly Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ExportButton label="Export Yearly" onClick={() => exportYearlySummary(data)} />
          <DatePicker label={nav.displayLabel} onPrev={nav.goPrev} onNext={nav.goNext} onToday={nav.goToday} todayLabel="This Year" />
        </div>
      </div>

      {/* Row 1: Annual Production KPIs */}
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title"><Factory size={18} /> Annual Production</h3>
        <div className="grid-5">
          <KPICard label="Total Production" value={yearlyProd.toFixed(0)} unit="kg" icon={Factory} color="teal" delay={0} />
          <KPICard label="Frame 41" value={yearlyFrame41.toFixed(0)} unit="kg" icon={Factory} color="blue" delay={1} sub={`${yearlyProd > 0 ? ((yearlyFrame41/yearlyProd)*100).toFixed(0) : 0}% of total`} />
          <KPICard label="Frame 47" value={yearlyFrame47.toFixed(0)} unit="kg" icon={Factory} color="purple" delay={2} sub={`${yearlyProd > 0 ? ((yearlyFrame47/yearlyProd)*100).toFixed(0) : 0}% of total`} />
          <KPICard label="Total Packing" value={yearlyPacking.toFixed(0)} unit="kg" icon={Scale} color="emerald" delay={3} />
          <KPICard label="Avg Monthly" value={avgMonthlyProd.toFixed(0)} unit="kg/mo" icon={BarChart3} color="cyan" delay={4} />
        </div>
      </div>

      {/* Row 2: Loss & Efficiency KPIs */}
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title"><TrendingDown size={18} /> Loss & Efficiency</h3>
        <div className="grid-5">
          <KPICard label="Spinning Loss" value={yearlySpinLoss} unit="%" icon={TrendingDown} color="amber" delay={5} sub={`${(yearlyProd - yearlyAutocorner).toFixed(0)} kg`} />
          <KPICard label="Autocorner Loss" value={yearlyAutoLoss} unit="%" icon={TrendingDown} color="red" delay={6} sub={`${(yearlyAutocorner - yearlyPacking).toFixed(0)} kg`} />
          <KPICard label="Overall Yield" value={yearlyOverallYield} unit="%" icon={Percent} color="emerald" delay={7} />
          <KPICard label="Active Months" value={activeMonths.length} unit="/ 12" icon={CalendarRange} color="blue" delay={8} />
          <KPICard label="Total Days" value={totalDays} icon={Clock} color="purple" delay={9} />
        </div>
      </div>

      {/* Row 3: Energy */}
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title"><Zap size={18} /> Energy Consumption</h3>
        <div className="grid-4">
          <KPICard label="Total EB Consumed" value={yearlyEB.toFixed(0)} unit="units" icon={Zap} color="amber" delay={10} />
          <KPICard label="Avg UKG (Year)" value={yearlyUKG} icon={Gauge} color="purple" delay={11} sub="EB / Production" />
          <KPICard label="Avg Monthly EB" value={avgMonthlyEB.toFixed(0)} unit="units" icon={Zap} color="cyan" delay={12} />
          {bestUKGMonth && (
            <KPICard label="Best UKG Month" value={MONTH_NAMES[bestUKGMonth.month - 1]} icon={Gauge} color="emerald" delay={13} sub={`UKG: ${bestUKGMonth.energy?.ukg}`} />
          )}
        </div>
      </div>

      {/* Row 4: Realisation & Waste */}
      {yearlyTotalCottonIssue > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="section-title"><Eye size={18} /> Raw Material & Realisation</h3>
          <div className="grid-5">
            <KPICard label="Cotton Issued" value={yearlyCotton.toFixed(0)} unit="kg" icon={Leaf} color="teal" delay={14} />
            <KPICard label="Fiber + Viscose + Excel" value={(yearlyFiber + yearlyViscose + yearlyExcel).toFixed(0)} unit="kg" icon={Leaf} color="blue" delay={15} />
            <KPICard label="Yarn Realisation" value={yearlyRealisationPct} unit="%" icon={Eye} color="emerald" delay={16} sub="Production / Material Input" />
            <KPICard label="Waste" value={yearlyWastePct} unit="%" icon={Leaf} color="amber" delay={17} sub={`${yearlyWaste.toFixed(0)} kg total`} />
            <KPICard label="Invisible Loss" value={yearlyInvisibleLossPct} unit="%" icon={Eye} color="red" delay={18} />
          </div>
        </div>
      )}

      {/* Row 5: Performance Highlights */}
      {bestMonth && worstMonth && activeMonths.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="section-title"><BarChart3 size={18} /> Performance Highlights</h3>
          <div className="grid-5">
            <KPICard label="Best Month (Prod)" value={MONTH_NAMES[bestMonth.month - 1]} icon={Factory} color="emerald"
              sub={`${Number(bestMonth.production?.totalProductionKg || 0).toFixed(0)} kg`} />
            <KPICard label="Lowest Month (Prod)" value={MONTH_NAMES[worstMonth.month - 1]} icon={ArrowDown} color="amber"
              sub={`${Number(worstMonth.production?.totalProductionKg || 0).toFixed(0)} kg`} />
            <KPICard label="Avg Daily (Year)" value={totalDays > 0 ? (yearlyProd / totalDays).toFixed(1) : '0'} unit="kg/day" icon={Scale} color="cyan" />
            <KPICard label="Total Lost (Year)" value={(yearlyProd - yearlyPacking).toFixed(0)} unit="kg" icon={ArrowDown} color="red" sub="Production - Packing" />
            {worstUKGMonth && bestUKGMonth !== worstUKGMonth && (
              <KPICard label="Worst UKG Month" value={MONTH_NAMES[worstUKGMonth.month - 1]} icon={Gauge} color="red" sub={`UKG: ${worstUKGMonth.energy?.ukg}`} />
            )}
          </div>
        </div>
      )}

      {/* Production Chart */}
      <div style={{ marginBottom: '24px' }}>
        <h3 className="section-title"><BarChart3 size={18} /> Monthly Production Trend</h3>
        <ProductionBarChart data={chartData} height={320} />
      </div>

      {/* UKG + Realisation Trend */}
      {ukgTrendData.some(d => d.ukg > 0 || d.realisation > 0) && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="section-title"><Gauge size={18} /> Realisation & Waste Trends</h3>
          <TrendLineChart
            data={ukgTrendData}
            lines={[
              { key: 'realisation', name: 'Realisation %', color: '#00d4aa' },
              { key: 'waste', name: 'Waste %', color: '#f59e0b' },
              { key: 'invisibleLoss', name: 'Invisible Loss %', color: '#ef4444' },
            ]}
            height={280}
          />
        </div>
      )}

      {/* Spinning Loss Trend */}
      {activeMonths.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="section-title"><TrendingDown size={18} /> Loss & Energy Trends</h3>
          <TrendLineChart
            data={months.map((m, i) => ({
              name: MONTH_NAMES[i],
              spinLoss: parseFloat(m.production?.spinningLossPercent || 0),
              autoLoss: parseFloat(m.production?.autocornerLossPercent || 0),
              ukg: parseFloat(m.energy?.ukg || 0),
            }))}
            lines={[
              { key: 'spinLoss', name: 'Spinning Loss %', color: '#f59e0b' },
              { key: 'autoLoss', name: 'Autocorner Loss %', color: '#ef4444' },
              { key: 'ukg', name: 'UKG', color: '#8b5cf6' },
            ]}
            height={280}
          />
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <div className="yearly-table-wrapper">
        <h3 className="section-title"><CalendarRange size={18} /> Monthly Breakdown</h3>
        <DataTable columns={columns} data={tableData} emptyMessage="No data for this year" />
      </div>
    </div>
  );
}
