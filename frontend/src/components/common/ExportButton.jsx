import { useState } from 'react';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import './ExportButton.css';

export default function ExportButton({ onClick, label = 'Export Excel', variant = 'primary' }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  return (
    <button
      className={`export-btn export-btn--${variant}`}
      onClick={handleClick}
      disabled={loading}
      title={label}
    >
      {loading ? (
        <Loader2 size={16} className="export-btn__spinner" />
      ) : (
        <FileSpreadsheet size={16} />
      )}
      <span>{loading ? 'Exporting...' : label}</span>
      <Download size={14} className="export-btn__arrow" />
    </button>
  );
}
