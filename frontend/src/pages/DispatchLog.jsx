import { useState } from 'react';
import { Truck, Filter, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { dispatchApi } from '../api/entries';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import '../pages/ProductionLog.css';

export default function DispatchLog() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', materialType: '', partyName: '', page: 1, limit: 15 });

  const { data, loading, error, refetch } = useApi(
    () => dispatchApi.getAll(filters),
    [filters.startDate, filters.endDate, filters.materialType, filters.partyName, filters.page]
  );

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const handlePageChange = (p) => setFilters(prev => ({ ...prev, page: p }));

  const columns = [
    { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'materialType', label: 'Material', render: (v) => <span className="badge badge-teal">{v}</span> },
    { key: 'lotNo', label: 'Lot No' },
    { key: 'partyName', label: 'Party' },
    { key: 'kgs', label: 'Weight (KG)', align: 'right', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
    { key: 'bags', label: 'Bags', align: 'right', render: (v) => Number(v).toFixed(1) },
    { key: 'pricePerBag', label: 'Price/Bag', align: 'right', render: (v) => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—' },
    { key: 'totalPrice', label: 'Total Value', align: 'right', render: (v) => v ? <strong style={{ color: 'var(--accent-emerald)' }}>₹{Number(v).toLocaleString('en-IN')}</strong> : '—' },
    { key: 'remarks', label: 'Remarks', render: (v) => v || <span style={{ color: 'var(--text-muted)' }}>—</span> },
  ];

  const entries = data?.data || [];
  const pagination = data?.pagination;

  // Calculate total dispatch value
  const totalValue = entries.reduce((sum, e) => sum + (parseFloat(e.totalPrice) || 0), 0);
  const totalKgs = entries.reduce((sum, e) => sum + (parseFloat(e.kgs) || 0), 0);

  return (
    <div className="page-container" id="dispatch-log">
      <div className="page-header">
        <h1 className="page-title"><Truck size={24} /> Dispatch Log</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {entries.length > 0 && (
            <>
              <span className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                Page Total: ₹{totalValue.toLocaleString('en-IN')}
              </span>
              <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                {totalKgs.toFixed(0)} kg
              </span>
            </>
          )}
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
          <label className="filter-label">Material</label>
          <select className="filter-select" value={filters.materialType} onChange={(e) => handleFilterChange('materialType', e.target.value)}>
            <option value="">All Materials</option>
            <option value="YARN">Yarn</option>
            <option value="COTTON">Cotton</option>
            <option value="WASTE">Waste</option>
          </select>
        </div>
        {(filters.startDate || filters.endDate || filters.materialType) && (
          <button className="btn" onClick={() => setFilters({ startDate: '', endDate: '', materialType: '', partyName: '', page: 1, limit: 15 })}>Clear</button>
        )}
      </div>

      {loading ? <Loader text="Loading dispatch entries..." /> : error ? <ErrorState message={error} onRetry={refetch} /> : (
        <DataTable columns={columns} data={entries} pagination={pagination} onPageChange={handlePageChange} emptyMessage="No dispatch entries found" />
      )}
    </div>
  );
}
