import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * Date navigation component
 * @param {string} label — display text (e.g. "Mon, 28 Mar 2026")
 * @param {Function} onPrev — go to previous
 * @param {Function} onNext — go to next
 * @param {Function} onToday — go to today/current
 * @param {string} todayLabel — label for today button
 */
export default function DatePicker({ label, onPrev, onNext, onToday, todayLabel = 'Today' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button className="btn btn-icon" onClick={onPrev} title="Previous">
        <ChevronLeft size={16} />
      </button>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 14px', borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)',
        minWidth: '200px', justifyContent: 'center',
      }}>
        <Calendar size={14} color="var(--accent-teal)" />
        {label}
      </div>
      <button className="btn btn-icon" onClick={onNext} title="Next">
        <ChevronRight size={16} />
      </button>
      <button className="btn" onClick={onToday} style={{ marginLeft: '4px' }}>
        {todayLabel}
      </button>
    </div>
  );
}
