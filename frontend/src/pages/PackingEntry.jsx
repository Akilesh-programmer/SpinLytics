import { useState, useCallback } from 'react';
import { PackageOpen, Check } from 'lucide-react';
import api from '../api/client';
import './EntryForm.css';

const today = () => new Date().toISOString().split('T')[0];

export default function PackingEntry() {
  const [form, setForm] = useState({
    date: today(), source: 'AUTOCORNER', yarnType: '', bags: '', lotNo: '', remarks: '',
  });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const kgs = parseFloat(form.bags) > 0 ? (parseFloat(form.bags) * 60).toFixed(1) : '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.yarnType || !form.bags || !form.lotNo) {
      showToast('Fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/packing', {
        date: form.date,
        source: form.source,
        yarnType: form.yarnType,
        bags: parseFloat(form.bags),
        lotNo: form.lotNo,
        remarks: form.remarks || null,
      });
      showToast('Packing entry saved');
      setForm((p) => ({ ...p, yarnType: '', bags: '', lotNo: '', remarks: '' }));
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="entry-form-page" id="packing-entry">
      <div className="page-header">
        <h1 className="page-title"><PackageOpen size={24} /> Packing Entry</h1>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        <div className="entry-form-grid">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Source</label>
            <select value={form.source} onChange={(e) => update('source', e.target.value)}>
              <option value="AUTOCORNER">Autocorner</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </div>
          <div className="form-group">
            <label>Yarn Type</label>
            <input value={form.yarnType} onChange={(e) => update('yarnType', e.target.value)} placeholder="Cotton 40s" required />
          </div>
          <div className="form-group">
            <label>Bags</label>
            <input type="number" step="any" value={form.bags} onChange={(e) => update('bags', e.target.value)} placeholder="8" required />
            <span className="auto-calc-label">= {kgs} kg</span>
          </div>
          <div className="form-group">
            <label>Lot No.</label>
            <input value={form.lotNo} onChange={(e) => update('lotNo', e.target.value)} placeholder="LOT-2026-042" required />
          </div>
          <div className="form-group full-width">
            <label>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => update('remarks', e.target.value)} placeholder="Optional notes..." rows={2} />
          </div>
        </div>

        <div className="entry-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : <><Check size={16} /> Save Packing Entry</>}
          </button>
        </div>
      </form>

      {toast && <div className={`entry-toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
