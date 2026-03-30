import {
  CalendarDays, Factory, TrendingDown, Zap, Gauge, BarChart3,
  Layers, Leaf, FlaskConical, Eye, Package, Scale, ArrowDown,
  Percent, ArrowUp, Clock,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { dashboardApi } from '../api/dashboard';
import { productionApi } from '../api/production';
import KPICard from '../components/common/KPICard';
import DatePicker from '../components/common/DatePicker';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import ProductionBarChart from '../components/charts/ProductionBarChart';
import MetricsDonut from '../components/charts/MetricsDonut';
import TrendLineChart from '../components/charts/TrendLineChart';
import DataTable from '../components/common/DataTable';
import './MonthlyDashboard.css';

export default function MonthlyDashboard() {
  const nav = useDateNavigation('month');
  const { data, loading, error, refetch } = useApi(
    () => dashboardApi.getMonthlySummary(nav.year, nav.month),
    [nav.year, nav.month]
  );

  // Fetch daily production for the month's trend chart
  const startDate = `${nav.year}-${String(nav.month).padStart(2, '0')}-01`;
  const lastDay = new Date(nav.year, nav.month, 0).getDate();
  const endDate = `${nav.year}-${String(nav.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data: prodData } = useApi(
    () => productionApi.getAll({ startDate, endDate, limit: 100 }),
    [startDate, endDate]
  );

  if (loading) return <div className="page-container"><Loader text="Loading monthly data..." /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={refetch} /></div>;

  const { production, rawMaterials, metrics, energy } = data || {};

  if (!production || Number(production.totalProductionKg) === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title"><CalendarDays size={24} /> Monthly Dashboard</h1>
          <DatePicker label={nav.displayLabel} onPrev={nav.goPrev} onNext={nav.goNext} onToday={nav.goToday} todayLabel="This Month" />
        </div>
        <EmptyState message="No production data for this month" sub="Try selecting a different month" />
      </div>
    );
  }

  // Compute additional insight values
  const totalProd = parseFloat(production.totalProductionKg);
  const totalAuto = parseFloat(production.totalAutocornerKg);
  const totalPack = parseFloat(production.totalPackingKg);
  const daysRecorded = production.daysRecorded || 1;
  const avgDailyProd = totalProd / daysRecorded;
  const totalSpinLossKg = totalProd - totalAuto;
  const totalAutoLossKg = totalAuto - totalPack;
  const overallYield = totalProd > 0 ? ((totalPack / totalProd) * 100).toFixed(1) : '0';
  const cottonIssue = parseFloat(rawMaterials?.totalCottonIssueKg || 0);
  const totalWaste = parseFloat(metrics?.totalWasteKg || 0);

  // Bar chart data
  const barChartData = [
    { name: 'Production', frame41: parseFloat(production.frame41Kg), frame47: parseFloat(production.frame47Kg) },
    { name: 'Autocorner', frame41: totalAuto * (parseFloat(production.frame41Kg) / (totalProd || 1)), frame47: totalAuto * (parseFloat(production.frame47Kg) / (totalProd || 1)) },
  ];

  // Daily production trend from prodData
  const dailyTrend = [];
  if (prodData?.data) {
    const dayMap = {};
    for (const entry of prodData.data) {
      const day = new Date(entry.date).getDate();
      if (!dayMap[day]) dayMap[day] = { name: `Day ${day}`, production: 0, autocorner: 0, packing: 0, ebUnits: 0, spindles: 0 };
      dayMap[day].production += parseFloat(entry.productionKg);
      dayMap[day].autocorner += parseFloat(entry.autocornerProductionKg);
      dayMap[day].packing += parseFloat(entry.packingKg);
      dayMap[day].ebUnits += parseFloat(entry.ebUnits);
      dayMap[day].spindles += entry.noOfSpindles;
    }
    const sortedDays = Object.keys(dayMap).sort((a, b) => Number(a) - Number(b));
    for (const d of sortedDays) {
      dailyTrend.push(dayMap[d]);
    }
  }

  // Daily data table
  const dailyTableData = dailyTrend.map((d, i) => ({
    id: i,
    day: d.name,
    production: d.production.toFixed(1),
    autocorner: d.autocorner.toFixed(1),
    packing: d.packing.toFixed(1),
    spinLoss: (d.production - d.autocorner).toFixed(1),
    spinLossPct: d.production > 0 ? (((d.production - d.autocorner) / d.production) * 100).toFixed(1) : '0',
    totalLoss: (d.production - d.packing).toFixed(1),
    ebUnits: d.ebUnits.toFixed(1),
    ukg: d.production > 0 ? (d.ebUnits / d.production).toFixed(4) : '-',
    gps: d.spindles > 0 ? (d.production / d.spindles).toFixed(4) : '-',
  }));

  const dailyTableColumns = [
    { key: 'day', label: 'Day' },
    { key: 'production', label: 'Prod (kg)', align: 'right' },
    { key: 'autocorner', label: 'Auto (kg)', align: 'right' },
    { key: 'packing', label: 'Pack (kg)', align: 'right' },
    { key: 'spinLoss', label: 'Spin Loss', align: 'right', render: (v) => <span style={{ color: 'var(--accent-amber)' }}>{v} kg</span> },
    { key: 'spinLossPct', label: 'Spin %', align: 'right', render: (v) => <span style={{ color: 'var(--accent-amber)' }}>{v}%</span> },
    { key: 'totalLoss', label: 'Total Loss', align: 'right', render: (v) => <span style={{ color: 'var(--accent-red)' }}>{v} kg</span> },
    { key: 'ebUnits', label: 'EB Units', align: 'right' },
    { key: 'ukg', label: 'UKG', align: 'right' },
    { key: 'gps', label: 'GPS', align: 'right', render: (v) => <span style={{ color: 'var(--accent-emerald)' }}>{v}</span> },
  ];

  return (
    <div className="page-container" id="monthly-dashboard">
      <div className="page-header">
        <h1 className="page-title"><CalendarDays size={24} /> Monthly Dashboard</h1>
        <DatePicker label={nav.displayLabel} onPrev={nav.goPrev} onNext={nav.goNext} onToday={nav.goToday} todayLabel="This Month" />
      </div>

      {/* Row 1: Production KPIs */}
      <div className="monthly-section">
        <h3 className="section-title"><BarChart3 size={18} /> Production Summary</h3>
        <div className="grid-5">
          <KPICard label="Frame 41" value={Number(production.frame41Kg).toFixed(1)} unit="kg" icon={Factory} color="teal" delay={0} sub={`${totalProd > 0 ? ((parseFloat(production.frame41Kg) / totalProd) * 100).toFixed(0) : 0}% of total`} />
          <KPICard label="Frame 47" value={Number(production.frame47Kg).toFixed(1)} unit="kg" icon={Factory} color="blue" delay={1} sub={`${totalProd > 0 ? ((parseFloat(production.frame47Kg) / totalProd) * 100).toFixed(0) : 0}% of total`} />
          <KPICard label="Total Production" value={totalProd.toFixed(1)} unit="kg" icon={Factory} color="emerald" delay={2} />
          <KPICard label="Avg Daily" value={avgDailyProd.toFixed(1)} unit="kg/day" icon={Scale} color="cyan" delay={3} sub={`${daysRecorded} days recorded`} />
          <KPICard label="Total Packing" value={totalPack.toFixed(1)} unit="kg" icon={Package} color="purple" delay={4} />
        </div>
      </div>

      {/* Row 2: Loss & Efficiency KPIs */}
      <div className="monthly-section">
        <h3 className="section-title"><TrendingDown size={18} /> Loss Analysis</h3>
        <div className="grid-5">
          <KPICard label="Spinning Loss" value={production.spinningLossPercent} unit="%" icon={TrendingDown} color="amber" delay={5} sub={`${totalSpinLossKg.toFixed(1)} kg`} />
          <KPICard label="Autocorner Loss" value={production.autocornerLossPercent} unit="%" icon={TrendingDown} color="red" delay={6} sub={`${totalAutoLossKg.toFixed(1)} kg`} />
          <KPICard label="Overall Yield" value={overallYield} unit="%" icon={Percent} color="emerald" delay={7} sub="Packing / Production" />
          <KPICard label="Total Lost" value={(totalSpinLossKg + totalAutoLossKg).toFixed(1)} unit="kg" icon={ArrowDown} color="red" delay={8} sub="Spinning + Autocorner" />
          <KPICard label="EB Units" value={Number(energy?.ebUnitsConsumed || 0).toFixed(0)} icon={Zap} color="amber" delay={9} />
        </div>
      </div>

      {/* Row 3: Energy */}
      <div className="monthly-section">
        <div className="grid-3">
          <KPICard label="UKG" value={energy?.ukg || '0'} icon={Gauge} color="purple" delay={10} sub="EB Units / Total Production" />
          <KPICard label="Days Recorded" value={daysRecorded} icon={Clock} color="blue" delay={11} />
          <KPICard label="Total Autocorner" value={totalAuto.toFixed(1)} unit="kg" icon={Factory} color="teal" delay={12} />
        </div>
      </div>

      {/* Row 4: Raw Materials Issued */}
      {rawMaterials && (
        <div className="monthly-section">
          <h3 className="section-title"><Layers size={18} /> Raw Materials Issued</h3>
          <div className="monthly-raw-grid">
            <div className="raw-material-card" style={{ animationDelay: '0.1s' }}>
              <div className="raw-material-label">Cotton</div>
              <div className="raw-material-value">{Number(rawMaterials.cottonIssueKg).toFixed(1)}<span className="raw-material-unit">kg</span></div>
            </div>
            <div className="raw-material-card" style={{ animationDelay: '0.15s' }}>
              <div className="raw-material-label">Fiber</div>
              <div className="raw-material-value">{Number(rawMaterials.fiberIssueKg).toFixed(1)}<span className="raw-material-unit">kg</span></div>
            </div>
            <div className="raw-material-card" style={{ animationDelay: '0.2s' }}>
              <div className="raw-material-label">Viscose</div>
              <div className="raw-material-value">{Number(rawMaterials.viscoseIssueKg).toFixed(1)}<span className="raw-material-unit">kg</span></div>
            </div>
            <div className="raw-material-card" style={{ animationDelay: '0.25s' }}>
              <div className="raw-material-label">Excel</div>
              <div className="raw-material-value">{Number(rawMaterials.excelIssueKg).toFixed(1)}<span className="raw-material-unit">kg</span></div>
            </div>
            <div className="raw-material-card" style={{ animationDelay: '0.3s', borderColor: 'var(--accent-teal)', borderWidth: '1px' }}>
              <div className="raw-material-label">Total Cotton Issue</div>
              <div className="raw-material-value" style={{ color: 'var(--accent-teal)' }}>
                {cottonIssue.toFixed(1)}<span className="raw-material-unit">kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 5: Realisation Metrics */}
      <div className="monthly-section">
        <h3 className="section-title"><Eye size={18} /> Realisation & Waste Analysis</h3>
        <div className="grid-4">
          <KPICard label="Yarn Realisation" value={metrics?.yarnRealisationPercent || '0'} unit="%" icon={FlaskConical} color="teal" delay={13} sub="Production / Cotton Issue" />
          <KPICard label="Waste" value={metrics?.wastePercent || '0'} unit="%" icon={Leaf} color="amber" delay={14} sub={`${totalWaste.toFixed(1)} kg total waste`} />
          <KPICard label="Invisible Loss" value={metrics?.invisibleLossPercent || '0'} unit="%" icon={Eye} color="red" delay={15} sub="100 - Realisation - Waste" />
          <KPICard label="Raw Material Efficiency" value={cottonIssue > 0 ? ((totalProd / cottonIssue) * 100).toFixed(1) : '0'} unit="%" icon={ArrowUp} color="emerald" delay={16} sub="Production / Material Input" />
        </div>
      </div>

      {/* Charts: Bar + Donut */}
      <div className="monthly-section">
        <div className="monthly-charts">
          <div>
            <h3 className="section-title"><BarChart3 size={18} /> Production by Frame</h3>
            <ProductionBarChart data={barChartData} height={280} />
          </div>
          {metrics && (
            <div>
              <h3 className="section-title"><Eye size={18} /> Realisation Breakdown</h3>
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

      {/* Best / Worst Day */}
      {dailyTrend.length > 1 && (
        <div className="monthly-section">
          <h3 className="section-title"><Scale size={18} /> Day Performance</h3>
          {(() => {
            const sorted = [...dailyTrend].sort((a, b) => b.production - a.production);
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];
            const maxEB = [...dailyTrend].sort((a, b) => b.ebUnits - a.ebUnits)[0];
            const bestUKGDay = [...dailyTrend].filter(d => d.production > 0).sort((a, b) => (a.ebUnits / a.production) - (b.ebUnits / b.production))[0];
            return (
              <div className="grid-4">
                <KPICard label="Best Day (Prod)" value={best.name} icon={ArrowUp} color="emerald" sub={`${best.production.toFixed(0)} kg`} />
                <KPICard label="Lowest Day (Prod)" value={worst.name} icon={ArrowDown} color="amber" sub={`${worst.production.toFixed(0)} kg`} />
                <KPICard label="Highest EB Day" value={maxEB.name} icon={Zap} color="red" sub={`${maxEB.ebUnits.toFixed(0)} units`} />
                {bestUKGDay && <KPICard label="Best UKG Day" value={bestUKGDay.name} icon={Gauge} color="cyan" sub={`UKG: ${(bestUKGDay.ebUnits / bestUKGDay.production).toFixed(4)}`} />}
              </div>
            );
          })()}
        </div>
      )}

      {/* Daily Production Trend Line Chart */}
      {dailyTrend.length > 1 && (
        <div className="monthly-section">
          <h3 className="section-title"><BarChart3 size={18} /> Daily Production Trend</h3>
          <TrendLineChart
            data={dailyTrend}
            lines={[
              { key: 'production', name: 'Production', color: '#00d4aa' },
              { key: 'autocorner', name: 'Autocorner', color: '#8b5cf6' },
              { key: 'packing', name: 'Packing', color: '#3b82f6' },
            ]}
            height={300}
          />
        </div>
      )}

      {/* Daily EB Units Trend */}
      {dailyTrend.length > 1 && (
        <div className="monthly-section">
          <h3 className="section-title"><Zap size={18} /> Daily EB Consumption</h3>
          <TrendLineChart
            data={dailyTrend}
            lines={[
              { key: 'ebUnits', name: 'EB Units', color: '#f59e0b' },
            ]}
            height={250}
          />
        </div>
      )}

      {/* Daily Breakdown Table */}
      {dailyTableData.length > 0 && (
        <div className="monthly-section">
          <h3 className="section-title"><CalendarDays size={18} /> Day-by-Day Breakdown</h3>
          <DataTable columns={dailyTableColumns} data={dailyTableData} emptyMessage="No daily data" />
        </div>
      )}
    </div>
  );
}
