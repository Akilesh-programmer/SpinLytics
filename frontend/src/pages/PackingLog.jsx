import { useState } from 'react';
import { PackageOpen, Filter, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { packingApi } from '../api/entries';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import ExportButton from '../components/common/ExportButton';
import { exportPackingLog } from '../utils/excelExport';
import '../pages/ProductionLog.css';

export default function PackingLog() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', source: '', page: 1, limit: 15 });

  const { data, loading, error, refetch } = useApi(
    () => packingApi.getAll(filters),
    [filters.startDate, filters.endDate, filters.source, filters.page]
  );

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handlePageChange = (p) => setFilters(prev => ({ ...prev, page: p }));

  const columns = [
    { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'source', label: 'Source', render: (v) => <span className={`badge ${v === 'AUTOCORNER' ? 'badge-teal' : 'badge-blue'}`}>{v}</span> },
    { key: 'yarnType', label: 'Yarn Type' },
    { key: 'kgs', label: 'Weight (KG)', align: 'right', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
    { key: 'bags', label: 'Bags', align: 'right', render: (v) => Number(v).toFixed(1) },
    { key: 'lotNo', label: 'Lot No' },
    { key: 'remarks', label: 'Remarks', render: (v) => v || <span style={{ color: 'var(--text-muted)' }}>—</span> },
  ];

  const entries = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="page-container" id="packing-log">
      <div className="page-header">
        <h1 className="page-title"><PackageOpen size={24} /> Packing Log</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ExportButton label="Export Packing" onClick={() => exportPackingLog(entries)} variant={entries.length > 0 ? 'primary' : 'secondary'} />
          <button className="btn" onClick={refetch}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      <div className="production-filters">
        <Filter size={16} color="var(--text-muted)" />
        <div className="filter-group">
          <label className="filter-label">From</label>
          <input type="date" className="filter-input" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label">To</label>
          <input type="date" className="filter-input" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
        </div>
        <div className="filter-group">
          <label className="filter-label">Source</label>
          <select className="filter-select" value={filters.source} onChange={(e) => handleFilterChange('source', e.target.value)}>
            <option value="">All Sources</option>
            <option value="AUTOCORNER">Autocorner</option>
            <option value="PRODUCTION">Production</option>
          </select>
        </div>
        {(filters.startDate || filters.endDate || filters.source) && (
          <button className="btn" onClick={() => setFilters({ startDate: '', endDate: '', source: '', page: 1, limit: 15 })}>Clear</button>
        )}
      </div>

      {loading ? <Loader text="Loading packing entries..." /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <DataTable columns={columns} data={entries} pagination={pagination} onPageChange={handlePageChange} emptyMessage="No packing entries found" />
      )}
    </div>
  );
}
