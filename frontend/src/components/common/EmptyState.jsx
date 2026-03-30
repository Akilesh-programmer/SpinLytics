import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data available', sub = '' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', gap: '12px', color: 'var(--text-muted)',
    }}>
      <Inbox size={40} strokeWidth={1.5} />
      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{message}</span>
      {sub && <span style={{ fontSize: '0.8rem' }}>{sub}</span>}
    </div>
  );
}
