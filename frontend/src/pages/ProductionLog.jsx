import { ClipboardList } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { shiftProductionApi } from '../api/shiftProduction';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import './ProductionLog.css';

export default function ProductionLog() {
  const { data, loading, error, refetch } = useApi(
    () => shiftProductionApi.getAll({ limit: 50 }),
    []
  );

  if (loading) return <div className="page-container"><Loader text="Loading production log..." /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={refetch} /></div>;

  const entries = data?.data || [];

  const columns = [
    { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'rfNo', label: 'R/F No.' },
    { key: 'siderName', label: 'Sider' },
    { key: 'count', label: 'Count', render: (v) => <span className="badge badge-teal">{v}</span> },
    { key: 'actualHK', label: 'Actual HK', align: 'right', render: (v) => Number(v).toFixed(1) },
    { key: 'grossKgs', label: 'Gross Kg', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-teal)' }}>{Number(row.calculated?.productionKgsGross || 0).toFixed(2)}</span> },
    { key: 'netKgs', label: 'Net Kg', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-emerald)' }}>{Number(row.calculated?.actualProductionKgs || 0).toFixed(2)}</span> },
    { key: 'wasteKgs', label: 'Waste', align: 'right', render: (v) => <span style={{ color: 'var(--accent-amber)' }}>{Number(v).toFixed(1)} kg</span> },
    { key: 'effPct', label: 'Eff %', align: 'right', render: (_, row) => <span style={{ color: 'var(--accent-cyan)' }}>{row.calculated?.efficiencyPercent}%</span> },
    { key: 'gps', label: 'G/Spindle', align: 'right', render: (_, row) => row.calculated?.gramsPerSpindle },
  ];

  return (
    <div className="page-container" id="production-log">
      <div className="page-header">
        <h1 className="page-title"><ClipboardList size={24} /> Production Log</h1>
        <span className="badge badge-purple">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="No production entries yet" sub="Use the Production Entry page to add data" />
      ) : (
        <DataTable columns={columns} data={entries} emptyMessage="No entries" />
      )}
    </div>
  );
}
