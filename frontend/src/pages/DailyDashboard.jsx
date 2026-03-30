import {
  LayoutDashboard, Factory, Zap, Gauge, TrendingDown, BarChart3,
  Scale, ArrowDown, ArrowUp, Percent, Package, Layers,
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

  const { frames = [], totals } = data || {};

  // Calculate additional derived insights
  const frame41 = frames.find(f => f.frameNumber === 'FRAME_41');
  const frame47 = frames.find(f => f.frameNumber === 'FRAME_47');

  return (
    <div className="page-container" id="daily-dashboard">
      <div className="page-header">
        <h1 className="page-title"><LayoutDashboard size={24} /> Daily Dashboard</h1>
        <DatePicker
          label={nav.displayLabel}
          onPrev={nav.goPrev}
          onNext={nav.goNext}
          onToday={nav.goToday}
        />
      </div>

      {frames.length === 0 ? (
        <EmptyState message="No production data for this date" sub="Try selecting a different date" />
      ) : (
        <>
          {/* Frame Cards */}
          <div className="daily-frames">
            {frames.map((frame) => {
              const prod = Number(frame.productionKg);
              const auto = Number(frame.autocornerProductionKg);
              const pack = Number(frame.packingKg);
              const yieldPct = prod > 0 ? ((pack / prod) * 100).toFixed(1) : '0';
              
              return (
                <div className="frame-card" key={frame.id}>
                  <div className="frame-header">
                    <div className="frame-title">
                      <span
                        className="frame-indicator"
                        style={{ background: frame.frameNumber === 'FRAME_41' ? 'var(--accent-teal)' : 'var(--accent-blue)' }}
                      />
                      {frame.frameNumber === 'FRAME_41' ? 'Frame 41' : 'Frame 47'}
                    </div>
                    <span className="badge badge-teal">{prod.toFixed(1)} kg</span>
                  </div>

                  <div className="frame-grid">
                    <div className="frame-metric">
                      <div className="frame-metric-label">Production</div>
                      <div className="frame-metric-value">
                        {prod.toFixed(1)}<span className="frame-metric-unit">kg</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Autocorner</div>
                      <div className="frame-metric-value">
                        {auto.toFixed(1)}<span className="frame-metric-unit">kg</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Packing</div>
                      <div className="frame-metric-value">
                        {pack.toFixed(1)}<span className="frame-metric-unit">kg</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Overall Yield</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-emerald)' }}>
                        {yieldPct}<span className="frame-metric-unit">%</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">EB Units</div>
                      <div className="frame-metric-value">
                        {Number(frame.ebUnits).toFixed(1)}
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Spindles</div>
                      <div className="frame-metric-value">{frame.noOfSpindles}</div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Spinning Loss</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-amber)' }}>
                        {frame.calculated.spinningLossPercent}<span className="frame-metric-unit">%</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Spinning Loss KG</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-amber)' }}>
                        {Number(frame.calculated.spinningLossKg).toFixed(1)}<span className="frame-metric-unit">kg</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Autocorner Loss</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-red)' }}>
                        {frame.calculated.autocornerLossPercent}<span className="frame-metric-unit">%</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">Autocorner Loss KG</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-red)' }}>
                        {Number(frame.calculated.autocornerLossKg).toFixed(1)}<span className="frame-metric-unit">kg</span>
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">UKG</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-purple)' }}>
                        {frame.calculated.ukg}
                      </div>
                    </div>
                    <div className="frame-metric">
                      <div className="frame-metric-label">GPS</div>
                      <div className="frame-metric-value" style={{ color: 'var(--accent-emerald)' }}>
                        {frame.calculated.gps}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined Totals KPI Cards */}
          {totals && (
            <div className="daily-totals">
              <h3 className="section-title"><BarChart3 /> Combined Totals</h3>
              <div className="grid-4">
                <KPICard label="Total Production" value={Number(totals.totalProductionKg).toFixed(1)} unit="kg" icon={Factory} color="teal" delay={0} />
                <KPICard label="Total Autocorner" value={Number(totals.totalAutocornerKg).toFixed(1)} unit="kg" icon={Factory} color="blue" delay={1} />
                <KPICard label="Total Packing" value={Number(totals.totalPackingKg).toFixed(1)} unit="kg" icon={Package} color="emerald" delay={2} />
                <KPICard
                  label="Overall Yield"
                  value={Number(totals.totalProductionKg) > 0 ? ((Number(totals.totalPackingKg) / Number(totals.totalProductionKg)) * 100).toFixed(1) : '0'}
                  unit="%"
                  icon={Percent}
                  color="cyan"
                  sub="Packing / Production"
                  delay={3}
                />
              </div>
              <div className="grid-4" style={{ marginTop: '16px' }}>
                <KPICard label="Spinning Loss" value={totals.spinningLossPercent} unit="%" icon={TrendingDown} color="amber" delay={4}
                  sub={`${(Number(totals.totalProductionKg) - Number(totals.totalAutocornerKg)).toFixed(1)} kg lost`}
                />
                <KPICard label="Autocorner Loss" value={totals.autocornerLossPercent} unit="%" icon={TrendingDown} color="red" delay={5}
                  sub={`${(Number(totals.totalAutocornerKg) - Number(totals.totalPackingKg)).toFixed(1)} kg lost`}
                />
                <KPICard label="UKG" value={totals.ukg} icon={Zap} color="purple" sub="EB Units / Production" delay={6} />
                <KPICard label="GPS" value={totals.gps} icon={Gauge} color="cyan" sub="Gram per Spindle" delay={7} />
              </div>
              <div className="grid-4" style={{ marginTop: '16px' }}>
                <KPICard label="Total EB Units" value={Number(totals.totalEBUnits).toFixed(1)} icon={Zap} color="amber" delay={8} />
                <KPICard label="Total Spindles" value={totals.totalSpindles} icon={Factory} color="purple" delay={9} />
                <KPICard
                  label="Total Material Lost"
                  value={(Number(totals.totalProductionKg) - Number(totals.totalPackingKg)).toFixed(1)}
                  unit="kg"
                  icon={ArrowDown}
                  color="red"
                  sub="Production - Packing"
                  delay={10}
                />
                <KPICard
                  label="Avg Production/Frame"
                  value={(Number(totals.totalProductionKg) / frames.length).toFixed(1)}
                  unit="kg"
                  icon={Scale}
                  color="blue"
                  delay={11}
                />
              </div>
            </div>
          )}

          {/* Frame-wise Production Comparison Chart */}
          {frame41 && frame47 && (
            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title"><BarChart3 /> Frame Comparison</h3>
              <ProductionBarChart
                data={[
                  {
                    name: 'Production',
                    frame41: parseFloat(frame41.productionKg),
                    frame47: parseFloat(frame47.productionKg),
                  },
                  {
                    name: 'Autocorner',
                    frame41: parseFloat(frame41.autocornerProductionKg),
                    frame47: parseFloat(frame47.autocornerProductionKg),
                  },
                  {
                    name: 'Packing',
                    frame41: parseFloat(frame41.packingKg),
                    frame47: parseFloat(frame47.packingKg),
                  },
                  {
                    name: 'EB Units',
                    frame41: parseFloat(frame41.ebUnits),
                    frame47: parseFloat(frame47.ebUnits),
                  },
                ]}
                height={300}
              />
            </div>
          )}

          {/* Frame Efficiency Comparison */}
          {frame41 && frame47 && (
            <div style={{ marginTop: '20px' }}>
              <h3 className="section-title"><Gauge /> Efficiency Comparison</h3>
              <div className="grid-4">
                <KPICard
                  label="F41 Spinning Loss"
                  value={frame41.calculated.spinningLossPercent}
                  unit="%"
                  icon={ArrowDown}
                  color={parseFloat(frame41.calculated.spinningLossPercent) <= parseFloat(frame47.calculated.spinningLossPercent) ? 'emerald' : 'red'}
                  sub={parseFloat(frame41.calculated.spinningLossPercent) <= parseFloat(frame47.calculated.spinningLossPercent) ? '✓ Better' : '↑ Higher'}
                />
                <KPICard
                  label="F47 Spinning Loss"
                  value={frame47.calculated.spinningLossPercent}
                  unit="%"
                  icon={ArrowDown}
                  color={parseFloat(frame47.calculated.spinningLossPercent) <= parseFloat(frame41.calculated.spinningLossPercent) ? 'emerald' : 'red'}
                  sub={parseFloat(frame47.calculated.spinningLossPercent) <= parseFloat(frame41.calculated.spinningLossPercent) ? '✓ Better' : '↑ Higher'}
                />
                <KPICard
                  label="F41 UKG"
                  value={frame41.calculated.ukg}
                  icon={Zap}
                  color={parseFloat(frame41.calculated.ukg) <= parseFloat(frame47.calculated.ukg) ? 'emerald' : 'amber'}
                  sub={parseFloat(frame41.calculated.ukg) <= parseFloat(frame47.calculated.ukg) ? '✓ More efficient' : '↑ Less efficient'}
                />
                <KPICard
                  label="F47 UKG"
                  value={frame47.calculated.ukg}
                  icon={Zap}
                  color={parseFloat(frame47.calculated.ukg) <= parseFloat(frame41.calculated.ukg) ? 'emerald' : 'amber'}
                  sub={parseFloat(frame47.calculated.ukg) <= parseFloat(frame41.calculated.ukg) ? '✓ More efficient' : '↑ Less efficient'}
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          {frames.some(f => f.remarks) && (
            <div className="daily-remarks">
              <h3 className="section-title">Remarks</h3>
              {frames.filter(f => f.remarks).map(f => (
                <div className="remarks-card" key={f.id} style={{ marginBottom: '8px' }}>
                  <div className="remarks-label">{f.frameNumber === 'FRAME_41' ? 'Frame 41' : 'Frame 47'}</div>
                  <div className="remarks-text">{f.remarks}</div>
                </div>
              ))}
            </div>
          )}

          {/* Stock Position for the Day */}
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
