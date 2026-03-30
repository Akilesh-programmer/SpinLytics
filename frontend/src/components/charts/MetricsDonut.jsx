import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#00d4aa', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: payload[0].payload.fill }} />
        <span style={{ color: 'var(--text-secondary)' }}>{payload[0].name}:</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Number(payload[0].value).toFixed(2)}%</span>
      </div>
    </div>
  );
};

/**
 * Donut chart for realisation / waste / invisible loss breakdown
 */
export default function MetricsDonut({ realisation, waste, invisibleLoss, height = 260 }) {
  const data = [
    { name: 'Yarn Realisation', value: parseFloat(realisation) || 0, fill: COLORS[0] },
    { name: 'Waste', value: parseFloat(waste) || 0, fill: COLORS[1] },
    { name: 'Invisible Loss', value: parseFloat(invisibleLoss) || 0, fill: COLORS[2] },
  ].filter(d => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
