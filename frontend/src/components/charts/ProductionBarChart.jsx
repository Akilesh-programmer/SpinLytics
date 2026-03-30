import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.8rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-heading)' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Number(entry.value).toFixed(1)} kg</span>
        </div>
      ))}
    </div>
  );
};

export default function ProductionBarChart({ data, height = 320 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-color)' }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-color)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
          <Bar dataKey="frame41" name="Frame 41" fill="#00d4aa" radius={[4, 4, 0, 0]} />
          <Bar dataKey="frame47" name="Frame 47" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
