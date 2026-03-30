import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Trend line chart — configurable lines
 * @param {Array} data — chart data
 * @param {Array} lines — [{ key, name, color }]
 * @param {number} height
 */
export default function TrendLineChart({ data, lines, height = 300 }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3, fill: line.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
