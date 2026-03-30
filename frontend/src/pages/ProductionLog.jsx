import { useState, useCallback } from 'react';
import { ClipboardList, Filter, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { productionApi } from '../api/production';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import ExportButton from '../components/common/ExportButton';
import { exportProductionLog } from '../utils/excelExport';
import './ProductionLog.css';

export default function ProductionLog() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    frameNumber: '',
    page: 1,
    limit: 15,
  });

  const { data, loading, error, refetch } = useApi(
    () => productionApi.getAll(filters),
    [filters.startDate, filters.endDate, filters.frameNumber, filters.page]
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const columns = [
    {
      key: 'date', label: 'Date',
      render: (v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'frameNumber', label: 'Frame',
      render: (v) => (
        <span className={`badge ${v === 'FRAME_41' ? 'badge-teal' : 'badge-blue'}`}>
          {v === 'FRAME_41' ? 'Frame 41' : 'Frame 47'}
        </span>
      ),
    },
    { key: 'productionKg', label: 'Production (kg)', align: 'right', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
    { key: 'autocornerProductionKg', label: 'Autocorner (kg)', align: 'right', render: (v) => Number(v).toFixed(1) },
    { key: 'packingKg', label: 'Packing (kg)', align: 'right', render: (v) => Number(v).toFixed(1) },
    { key: 'ebUnits', label: 'EB Units', align: 'right', render: (v) => Number(v).toFixed(1) },
    { key: 'noOfSpindles', label: 'Spindles', align: 'center' },
    {
      key: 'calculated', label: 'Spin Loss %', align: 'right',
      render: (_, row) => <span style={{ color: 'var(--accent-amber)' }}>{row.calculated?.spinningLossPercent || '-'}%</span>,
    },
    {
      key: 'ukg', label: 'UKG', align: 'right',
      render: (_, row) => row.calculated?.ukg || '-',
    },
    {
      key: 'gps', label: 'GPS', align: 'right',
      render: (_, row) => <span style={{ color: 'var(--accent-emerald)' }}>{row.calculated?.gps || '-'}</span>,
    },
    { key: 'remarks', label: 'Remarks', render: (v) => v || <span style={{ color: 'var(--text-muted)' }}>—</span> },
  ];

  const entries = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="page-container" id="production-log">
      <div className="page-header">
        <h1 className="page-title"><ClipboardList size={24} /> Production Log</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ExportButton label="Export Production" onClick={() => exportProductionLog(entries, filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` : '')} variant={entries.length > 0 ? 'primary' : 'secondary'} />
          <button className="btn" onClick={refetch}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div className="production-filters">
        <Filter size={16} color="var(--text-muted)" />
        <div className="filter-group">
          <label className="filter-label">From</label>
          <input
            type="date"
            className="filter-input"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">To</label>
          <input
            type="date"
            className="filter-input"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Frame</label>
          <select
            className="filter-select"
            value={filters.frameNumber}
            onChange={(e) => handleFilterChange('frameNumber', e.target.value)}
          >
            <option value="">All Frames</option>
            <option value="FRAME_41">Frame 41</option>
            <option value="FRAME_47">Frame 47</option>
          </select>
        </div>
        {(filters.startDate || filters.endDate || filters.frameNumber) && (
          <button
            className="btn"
            onClick={() => setFilters({ startDate: '', endDate: '', frameNumber: '', page: 1, limit: 15 })}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading production entries..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={entries}
          pagination={pagination}
          onPageChange={handlePageChange}
          emptyMessage="No production entries found"
        />
      )}
    </div>
  );
}
