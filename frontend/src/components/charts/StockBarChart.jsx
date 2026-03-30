import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MATERIAL_COLORS = {
  COTTON: '#00d4aa',
  VISCOSE: '#3b82f6',
  FIBER: '#8b5cf6',
  EXCEL: '#06b6d4',
  YARN: '#10b981',
  WASTE: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-heading)' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)' }}>{Number(payload[0]?.value).toFixed(1)} kg</div>
    </div>
  );
};

export default function StockBarChart({ data, height = 280 }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map(item => ({
    name: item.materialType,
    stock: parseFloat(item.currentStockKg),
    fill: MATERIAL_COLORS[item.materialType] || '#00d4aa',
  }));

  return (
    <div className="card" style={{ padding: '16px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-color)' }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-color)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
