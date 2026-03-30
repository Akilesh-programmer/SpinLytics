import { Zap } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { ebApi } from '../api/entries';
import DataTable from '../components/common/DataTable';
import KPICard from '../components/common/KPICard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import TrendLineChart from '../components/charts/TrendLineChart';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function EnergyLog() {
  const { data, loading, error, refetch } = useApi(() => ebApi.getAll({ limit: 50 }), []);

  if (loading) return <div className="page-container"><Loader text="Loading EB data..." /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={refetch} /></div>;

  const entries = (data?.data || []).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Calculate totals
  const totalConsumed = entries.reduce((sum, e) => sum + (parseFloat(e.closingUnits) - parseFloat(e.openingUnits)), 0);
  const avgMonthly = entries.length > 0 ? totalConsumed / entries.length : 0;

  // Chart data
  const chartData = entries.map(e => ({
    name: `${MONTH_NAMES[e.month]?.substring(0, 3)} ${e.year}`,
    consumed: parseFloat(e.closingUnits) - parseFloat(e.openingUnits),
    closing: parseFloat(e.closingUnits),
  }));

  const columns = [
    { key: 'month', label: 'Month', render: (v, row) => `${MONTH_NAMES[v]} ${row.year}` },
    { key: 'openingUnits', label: 'Opening Units', align: 'right', render: (v) => Number(v).toLocaleString('en-IN') },
    { key: 'closingUnits', label: 'Closing Units', align: 'right', render: (v) => Number(v).toLocaleString('en-IN') },
    {
      key: 'consumed', label: 'Consumed (Units)', align: 'right',
      render: (_, row) => {
        const consumed = parseFloat(row.closingUnits) - parseFloat(row.openingUnits);
        return <strong style={{ color: 'var(--accent-amber)' }}>{consumed.toLocaleString('en-IN')}</strong>;
      },
    },
  ];

  return (
    <div className="page-container" id="energy-log">
      <div className="page-header">
        <h1 className="page-title"><Zap size={24} /> Energy (EB) Log</h1>
      </div>

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <KPICard label="Total EB Consumed" value={totalConsumed.toLocaleString('en-IN')} unit="units" icon={Zap} color="amber" />
        <KPICard label="Avg Monthly" value={avgMonthly.toFixed(0)} unit="units/mo" icon={Zap} color="cyan" />
        <KPICard label="Months Recorded" value={entries.length} icon={Zap} color="purple" />
      </div>

      {chartData.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="section-title"><Zap size={18} /> Consumption Trend</h3>
          <TrendLineChart
            data={chartData}
            lines={[
              { key: 'consumed', name: 'EB Consumed', color: '#f59e0b' },
            ]}
            height={280}
          />
        </div>
      )}

      <DataTable columns={columns} data={entries} emptyMessage="No EB entries found" />
    </div>
  );
}
