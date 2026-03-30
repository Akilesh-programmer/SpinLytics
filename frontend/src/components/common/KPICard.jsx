import './KPICard.css';

/**
 * KPI metric display card
 * @param {string} label — metric name
 * @param {string|number} value — metric value
 * @param {string} unit — optional unit suffix (kg, %, etc.)
 * @param {React.Component} icon — Lucide icon component
 * @param {string} color — accent color name: teal, blue, amber, red, emerald, purple, cyan
 * @param {string} sub — optional sub-label text
 * @param {number} delay — animation stagger index
 */
export default function KPICard({ label, value, unit, icon: Icon, color = 'teal', sub, delay = 0 }) {
  const colorMap = {
    teal:    { bg: 'var(--accent-teal-dim)',    fg: 'var(--accent-teal)',    accent: 'var(--accent-teal)' },
    blue:    { bg: 'var(--accent-blue-dim)',    fg: 'var(--accent-blue)',    accent: 'var(--accent-blue)' },
    amber:   { bg: 'var(--accent-amber-dim)',   fg: 'var(--accent-amber)',   accent: 'var(--accent-amber)' },
    red:     { bg: 'var(--accent-red-dim)',     fg: 'var(--accent-red)',     accent: 'var(--accent-red)' },
    emerald: { bg: 'var(--accent-emerald-dim)', fg: 'var(--accent-emerald)', accent: 'var(--accent-emerald)' },
    purple:  { bg: 'var(--accent-purple-dim)',  fg: 'var(--accent-purple)',  accent: 'var(--accent-purple)' },
    cyan:    { bg: 'var(--accent-cyan-dim)',    fg: 'var(--accent-cyan)',    accent: 'var(--accent-cyan)' },
  };

  const c = colorMap[color] || colorMap.teal;

  return (
    <div
      className="kpi-card"
      style={{ '--kpi-accent': c.accent, animationDelay: `${delay * 0.06}s` }}
    >
      {Icon && (
        <div className="kpi-icon" style={{ background: c.bg, color: c.fg }}>
          <Icon />
        </div>
      )}
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {value}
          {unit && <span className="kpi-unit">{unit}</span>}
        </div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
