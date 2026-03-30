import { useState } from 'react';
import { Package, Layers, Users, History, BarChart3, Scale } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { dashboardApi } from '../api/dashboard';
import { stockApi } from '../api/stock';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import StockBarChart from '../components/charts/StockBarChart';
import './StockDashboard.css';

const MATERIAL_COLORS = {
  COTTON: 'var(--accent-teal)',
  VISCOSE: 'var(--accent-blue)',
  FIBER: 'var(--accent-purple)',
  EXCEL: 'var(--accent-cyan)',
  YARN: 'var(--accent-emerald)',
  WASTE: 'var(--accent-amber)',
};

export default function StockDashboard() {
  const [activeTab, setActiveTab] = useState('lot');
  const { data: stockData, loading, error, refetch } = useApi(() => dashboardApi.getStockDashboard(), []);
  const { data: lotData } = useApi(() => stockApi.getLotWise(), []);
  const { data: partyData } = useApi(() => stockApi.getPartyWise(), []);

  if (loading) return <div className="page-container"><Loader text="Loading stock data..." /></div>;
  if (error) return <div className="page-container"><ErrorState message={error} onRetry={refetch} /></div>;

  const { currentStock = [], recentTransactions = [] } = stockData || {};

  const lotColumns = [
    { key: 'materialType', label: 'Material', render: (v) => <span className={`badge badge-teal`}>{v}</span> },
    { key: 'lotNo', label: 'Lot No' },
    { key: 'kgs', label: 'Stock (KG)', align: 'right', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
    { key: 'bags', label: 'Stock (Bags)', align: 'right', render: (v) => Number(v).toFixed(1) },
  ];

  const partyColumns = [
    { key: 'materialType', label: 'Material', render: (v) => <span className={`badge badge-blue`}>{v}</span> },
    { key: 'partyName', label: 'Party' },
    { key: 'kgs', label: 'KG', align: 'right', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
    { key: 'bags', label: 'Bags', align: 'right', render: (v) => Number(v).toFixed(1) },
  ];

  const txnColumns = [
    { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'transactionType', label: 'Type', render: (v) => {
      const colors = { PURCHASE: 'badge-emerald', ISSUE: 'badge-amber', DISPATCH: 'badge-red', RETURN: 'badge-blue' };
      return <span className={`badge ${colors[v] || 'badge-teal'}`}>{v}</span>;
    }},
    { key: 'materialType', label: 'Material' },
    { key: 'lotNo', label: 'Lot' },
    { key: 'partyName', label: 'Party' },
    { key: 'kgs', label: 'KG', align: 'right', render: (v) => <strong>{Number(v).toFixed(1)}</strong> },
    { key: 'bags', label: 'Bags', align: 'right', render: (v) => Number(v).toFixed(1) },
  ];

  return (
    <div className="page-container" id="stock-dashboard">
      <div className="page-header">
        <h1 className="page-title"><Package size={24} /> Stock Dashboard</h1>
      </div>

      {/* Current Stock Overview */}
      <div className="stock-section">
        <h3 className="section-title"><Package size={18} /> Current Stock</h3>
        {currentStock.length === 0 ? (
          <EmptyState message="No stock data available" />
        ) : (
          <div className="stock-overview">
            {currentStock.map((item, i) => (
              <div
                className="stock-material-card"
                key={item.materialType}
                style={{ animationDelay: `${i * 0.06}s`, borderTopColor: MATERIAL_COLORS[item.materialType], borderTopWidth: '2px' }}
              >
                <div className="stock-material-name">{item.materialType}</div>
                <div className="stock-material-value">
                  {Number(item.currentStockKg).toFixed(0)}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '3px' }}>kg</span>
                </div>
                <div className="stock-material-bags">{Number(item.currentStockBags).toFixed(1)} bags</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stock KPIs + Chart */}
      {currentStock.length > 0 && (
        <div className="stock-section">
          <div className="grid-3" style={{ marginBottom: '16px' }}>
            <KPICard
              label="Total Stock"
              value={currentStock.reduce((sum, s) => sum + parseFloat(s.currentStockKg), 0).toFixed(0)}
              unit="kg"
              icon={Scale}
              color="teal"
            />
            <KPICard
              label="Total Bags"
              value={currentStock.reduce((sum, s) => sum + parseFloat(s.currentStockBags), 0).toFixed(1)}
              unit="bags"
              icon={Package}
              color="blue"
            />
            <KPICard
              label="Material Types"
              value={currentStock.length}
              icon={Layers}
              color="purple"
            />
          </div>
          <h3 className="section-title"><BarChart3 size={18} /> Stock Comparison</h3>
          <StockBarChart data={currentStock} height={280} />
        </div>
      )}

      {/* Tabs: Lot-wise / Party-wise */}
      <div className="stock-section">
        <h3 className="section-title"><Layers size={18} /> Stock Breakdown</h3>
        <div className="stock-tabs">
          <button className={`stock-tab${activeTab === 'lot' ? ' active' : ''}`} onClick={() => setActiveTab('lot')}>
            <Layers size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Lot-wise
          </button>
          <button className={`stock-tab${activeTab === 'party' ? ' active' : ''}`} onClick={() => setActiveTab('party')}>
            <Users size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Party-wise
          </button>
        </div>
        {activeTab === 'lot' ? (
          <DataTable columns={lotColumns} data={lotData || []} emptyMessage="No lot-wise data" />
        ) : (
          <DataTable columns={partyColumns} data={partyData || []} emptyMessage="No party-wise data" />
        )}
      </div>

      {/* Recent Transactions */}
      <div className="stock-section">
        <h3 className="section-title"><History size={18} /> Recent Transactions</h3>
        <DataTable columns={txnColumns} data={recentTransactions} emptyMessage="No recent transactions" />
      </div>
    </div>
  );
}
