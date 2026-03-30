import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', gap: '14px',
    }}>
      <AlertTriangle size={40} strokeWidth={1.5} color="var(--accent-amber)" />
      <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{message}</span>
      {onRetry && (
        <button className="btn" onClick={onRetry} style={{ marginTop: '4px' }}>
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
