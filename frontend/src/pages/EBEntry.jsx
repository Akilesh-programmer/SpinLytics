import { useState, useEffect, useCallback } from 'react';
import { Zap, Check } from 'lucide-react';
import api from '../api/client';
import './EntryForm.css';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 3 + i);

export default function EBEntry() {
  const [form, setForm] = useState({
    month: currentMonth, year: currentYear, openingUnits: '', closingUnits: '',
  });
  const [autoFilled, setAutoFilled] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  // Auto-fill opening from previous month's closing
  useEffect(() => {
    const prevMonth = form.month === 1 ? 12 : form.month - 1;
    const prevYear = form.month === 1 ? form.year - 1 : form.year;

    api.get(`/eb?year=${prevYear}`).then((res) => {
      const prev = res.data?.data?.find((e) => e.month === prevMonth && e.year === prevYear);
      if (prev) {
        setForm((p) => ({ ...p, openingUnits: parseFloat(prev.closingUnits).toString() }));
        setAutoFilled(true);
        setManualOverride(false);
      } else {
        setAutoFilled(false);
      }
    }).catch(() => {
      setAutoFilled(false);
    });
  }, [form.month, form.year]);

  const ebConsumed = parseFloat(form.closingUnits) >= 0 && parseFloat(form.openingUnits) >= 0
    ? (parseFloat(form.closingUnits) - parseFloat(form.openingUnits)).toFixed(0)
    : '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.openingUnits || !form.closingUnits) {
      showToast('Fill opening and closing units', 'error');
      return;
    }
    if (parseFloat(form.closingUnits) < parseFloat(form.openingUnits)) {
      showToast('Closing must be ≥ Opening', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/eb', {
        month: parseInt(form.month),
        year: parseInt(form.year),
        openingUnits: parseFloat(form.openingUnits),
        closingUnits: parseFloat(form.closingUnits),
      });
      showToast('EB entry saved');
      setForm((p) => ({ ...p, openingUnits: '', closingUnits: '' }));
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="entry-form-page" id="eb-entry">
      <div className="page-header">
        <h1 className="page-title"><Zap size={24} /> EB (Electricity) Entry</h1>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        <div className="entry-form-grid">
          <div className="form-group">
            <label>Month</label>
            <select value={form.month} onChange={(e) => update('month', parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <select value={form.year} onChange={(e) => update('year', parseInt(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Opening Units</label>
            <input
              type="number"
              step="any"
              value={form.openingUnits}
              onChange={(e) => { update('openingUnits', e.target.value); setManualOverride(true); }}
              placeholder="10000"
              disabled={autoFilled && !manualOverride}
              required
            />
            {autoFilled && !manualOverride && (
              <span className="auto-calc-label">
                Auto-filled from prev month •{' '}
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }} onClick={() => setManualOverride(true)}>
                  Edit manually
                </button>
              </span>
            )}
          </div>
          <div className="form-group">
            <label>Closing Units</label>
            <input type="number" step="any" value={form.closingUnits} onChange={(e) => update('closingUnits', e.target.value)} placeholder="15000" required />
            {ebConsumed !== '—' && <span className="auto-calc-label">EB Consumed: {ebConsumed} units</span>}
          </div>
        </div>

        <div className="entry-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : <><Check size={16} /> Save EB Entry</>}
          </button>
        </div>
      </form>

      {toast && <div className={`entry-toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
