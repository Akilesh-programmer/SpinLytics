import {
  LayoutDashboard, Factory, Gauge, TrendingDown, BarChart3,
  Scale, Layers, Activity, Users, ArrowDown, Percent, AlertTriangle,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { dashboardApi } from '../api/dashboard';
import { stockApi } from '../api/stock';
import KPICard from '../components/common/KPICard';
import DatePicker from '../components/common/DatePicker';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import ProductionBarChart from '../components/charts/ProductionBarChart';
import DataTable from '../components/common/DataTable';
import ExportButton from '../components/common/ExportButton';
import { exportDailyProduction } from '../utils/excelExport';
import './DailyDashboard.css';

export default function DailyDashboard() {
  const nav = useDateNavigation('day');
  const { data, loading, error, refetch } = useApi(
    () => dashboardApi.getDailySummary(nav.dateStr),
    [nav.dateStr]
  );

  // Fetch stock position for this date
  const { data: openingStock } = useApi(() => stockApi.getOpeningStock(nav.dateStr), [nav.dateStr]);
  const { data: closingStock } = useApi(() => stockApi.getClosingStock(nav.dateStr), [nav.dateStr]);

  if (loading) return <div className="page-container"><Loader text="Loading daily production..." /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={refetch} /></div>;

  const { entries = [], countSummaries = [], totals, stoppages = [] } = data || {};

  return (
    <div className="page-container" id="daily-dashboard">
      <div className="page-header">
        <h1 className="page-title"><LayoutDashboard size={24} /> Daily Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ExportButton
            label="Export Daily Report"
            onClick={() => exportDailyProduction(data, nav.dateStr)}
            variant={entries.length > 0 ? 'primary' : 'secondary'}
          />
          <DatePicker
            label={nav.displayLabel}
            onPrev={nav.goPrev}
            onNext={nav.goNext}
            onToday={nav.goToday}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="No production data for this date" sub="Try selecting a different date or enter data via Production Entry" />
      ) : (
        <>
          {/* ═══ Grand Totals KPI Cards ═══ */}
          {totals && (
            <div className="daily-totals">
              <h3 className="section-title"><BarChart3 /> Production Summary</h3>
              <div className="grid-5">
                <KPICard label="Gross Production" value={Number(totals.totalGrossKgs).toFixed(1)} unit="kg" icon={Factory} color="teal" delay={0} sub="Actual HK × STD Constant" />
                <KPICard label="Net Production" value={Number(totals.totalNetKgs).toFixed(1)} unit="kg" icon={Factory} color="emerald" delay={1} sub="Gross − Waste" />
                <KPICard label="Total Waste" value={Number(totals.totalWasteKgs).toFixed(1)} unit="kg" icon={TrendingDown} color="amber" delay={2} sub={`${totals.wastePercent}% of gross`} />
                <KPICard label="Avg Efficiency" value={totals.avgEfficiency} unit="%" icon={Gauge} color="cyan" delay={3} sub="Actual HK / STD HK" />
                <KPICard label="Overall Yield" value={totals.overallYieldPercent} unit="%" icon={Percent} color="blue" delay={4} sub="Net / Gross × 100" />
              </div>
              <div className="grid-4" style={{ marginTop: '12px' }}>
                <KPICard label="Total Lost" value={Number(totals.totalLostKg).toFixed(1)} unit="kg" icon={ArrowDown} color="red" delay={5} sub="Gross − Net" />
                <KPICard label="Total Entries" value={totals.entryCount} icon={Users} color="purple" delay={6} sub={`${countSummaries.length} count type${countSummaries.length !== 1 ? 's' : ''}: ${countSummaries.map(c => c.count).join(', ')}`} />
                <KPICard label="Avg/Count" value={countSummaries.length > 0 ? (Number(totals.totalGrossKgs) / countSummaries.length).toFixed(1) : '0'} unit="kg" icon={Scale} color="purple" delay={7} sub={`Across ${countSummaries.length} counts`} />
              </div>
              {totals.hasAutocornerData && (
                <div className="grid-4" style={{ marginTop: '12px' }}>
                  <KPICard label="Autocorner" value={Number(totals.totalAutocornerKgs).toFixed(1)} unit="kg" icon={Layers} color="teal" sub="After spinning, before packing" />
                  <KPICard label="Spinning Loss" value={`${totals.spinningLossPercent}%`} icon={TrendingDown} color="amber" sub={`${Number(totals.spinningLossKg).toFixed(1)} kg (Gross − Auto)`} />
                  <KPICard label="Autocorner Loss" value={`${totals.autocornerLossPercent}%`} icon={TrendingDown} color="red" sub={`${Number(totals.autocornerLossKg).toFixed(1)} kg (Auto − Net)`} />
                </div>
              )}
            </div>
          )}

          {/* ═══ Count-wise (Frame) Comparison ═══ */}
          {countSummaries.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title"><Activity /> Count-wise Breakdown</h3>
              {countSummaries.length > 1 && (
                <ProductionBarChart
                  data={countSummaries.map((cs) => ({
                    name: cs.count,
                    gross: parseFloat(cs.totalGrossKgs),
                    net: parseFloat(cs.totalNetKgs),
                  }))}
                  height={280}
                />
              )}
              <div className="grid-4" style={{ marginTop: countSummaries.length > 1 ? '16px' : '0' }}>
                {countSummaries.map((cs, i) => (
                  <KPICard
                    key={cs.count}
                    label={`Count ${cs.count}`}
                    value={Number(cs.totalGrossKgs).toFixed(1)}
                    unit="kg"
                    icon={Factory}
                    color={['teal', 'blue', 'purple', 'cyan'][i % 4]}
                    sub={`${cs.entryCount} entries • Eff: ${cs.avgEfficiency}% • Waste: ${cs.wastePercent}%`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══ Efficiency Comparison ═══ */}
          {countSummaries.length > 1 && (
            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title"><Gauge /> Efficiency Comparison</h3>
              <div className="grid-3">
                {(() => {
                  const bestEff = countSummaries.reduce((a, b) => parseFloat(b.avgEfficiency) > parseFloat(a.avgEfficiency) ? b : a);
                  const lowestWaste = countSummaries.reduce((a, b) => parseFloat(b.wastePercent) < parseFloat(a.wastePercent) ? b : a);
                  const highestProd = countSummaries.reduce((a, b) => parseFloat(b.totalGrossKgs) > parseFloat(a.totalGrossKgs) ? b : a);
                  return (
                    <>
                      <KPICard label="Best Efficiency" value={`Count ${bestEff.count}`} icon={Gauge} color="emerald" sub={`${bestEff.avgEfficiency}% ✓ Best`} />
                      <KPICard label="Lowest Waste" value={`Count ${lowestWaste.count}`} icon={TrendingDown} color="teal" sub={`${lowestWaste.wastePercent}% ✓ Better`} />
                      <KPICard label="Highest Production" value={`Count ${highestProd.count}`} icon={Factory} color="cyan" sub={`${Number(highestProd.totalGrossKgs).toFixed(1)} kg`} />
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ═══ Detailed Entries Table ═══ */}
          <div style={{ marginTop: '20px' }}>
            <h3 className="section-title"><Scale /> Shift Entries Detail</h3>
            <DataTable
              columns={[
                { key: 'rfNo', label: 'R/F No.' },
                { key: 'siderName', label: 'Sider' },
                { key: 'count', label: 'Count', render: (v) => <span className="badge badge-teal">{v}</span> },
                { key: 'actualHK', label: 'Actual HK', align: 'right', render: (v) => Number(v).toFixed(1) },
                { key: 'productionKgsGross', label: 'Gross Kg', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-teal)' }}>{Number(row.calculated?.productionKgsGross || 0).toFixed(2)}</span> },
                { key: 'actualProductionKgs', label: 'Net Kg', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-emerald)' }}>{Number(row.calculated?.actualProductionKgs || 0).toFixed(2)}</span> },
                { key: 'wastePercent', label: 'Waste %', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-amber)' }}>{row.calculated?.wastePercent}%</span> },
                { key: 'efficiencyPercent', label: 'Efficiency', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-cyan)' }}>{row.calculated?.efficiencyPercent}%</span> },
                { key: 'gramsPerSpindle', label: 'G/Spindle', align: 'right', render: (_, row) => row.calculated?.gramsPerSpindle },
                { key: 'workedSpindles', label: 'Wkd Spnl', align: 'right', render: (_, row) => row.calculated?.workedSpindles },
                { key: 'stoppages', label: 'Stoppages', render: (v) => v || '—' },
              ]}
              data={entries}
              emptyMessage="No entries"
            />
          </div>

          {/* ═══ Stoppages / Remarks ═══ */}
          {stoppages.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title"><AlertTriangle /> Stoppages & Remarks</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {stoppages.map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '12px 16px', border: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="badge badge-amber">{s.rfNo}</span>
                    <span className="badge badge-teal">{s.count}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{s.stoppages}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Stock Position ═══ */}
          {(openingStock?.length > 0 || closingStock?.length > 0) && (
            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title"><Layers /> Stock Position</h3>
              <DataTable
                columns={[
                  { key: 'materialType', label: 'Material', render: (v) => <span className="badge badge-teal">{v}</span> },
                  { key: 'opening', label: 'Opening (kg)', align: 'right', render: (v) => v !== undefined ? Number(v).toFixed(1) : '-' },
                  { key: 'closing', label: 'Closing (kg)', align: 'right', render: (v) => v !== undefined ? Number(v).toFixed(1) : '-' },
                  { key: 'change', label: 'Change (kg)', align: 'right', render: (v, row) => {
                    if (row.opening === undefined || row.closing === undefined) return '-';
                    const diff = row.closing - row.opening;
                    return <span style={{ color: diff >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)', fontWeight: 600 }}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}</span>;
                  }},
                ]}
                data={(() => {
                  const materials = new Set([...(openingStock || []).map(s => s.materialType), ...(closingStock || []).map(s => s.materialType)]);
                  return Array.from(materials).map(mat => ({
                    id: mat,
                    materialType: mat,
                    opening: openingStock?.find(s => s.materialType === mat)?.openingStockKg,
                    closing: closingStock?.find(s => s.materialType === mat)?.closingStockKg,
                  }));
                })()}
                emptyMessage="No stock data for this date"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
