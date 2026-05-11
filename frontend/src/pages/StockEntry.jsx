import { useState, useCallback } from 'react';
import { Package, Check } from 'lucide-react';
import api from '../api/client';
import './EntryForm.css';

const today = () => new Date().toISOString().split('T')[0];
const MATERIALS = ['COTTON', 'VISCOSE', 'FIBER', 'EXCEL', 'YARN', 'WASTE'];
const TXN_TYPES = ['PURCHASE', 'ISSUE', 'RETURN'];

export default function StockEntry() {
  const [form, setForm] = useState({
    date: today(), materialType: 'COTTON', transactionType: 'PURCHASE',
    lotNo: '', partyName: '', bags: '', pricePerBag: '', remarks: '',
  });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const kgs = parseFloat(form.bags) > 0 ? (parseFloat(form.bags) * 60).toFixed(1) : '—';
  const totalPrice = parseFloat(form.bags) > 0 && parseFloat(form.pricePerBag) > 0
    ? (parseFloat(form.bags) * parseFloat(form.pricePerBag)).toFixed(2)
    : '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lotNo || !form.partyName || !form.bags) {
      showToast('Fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/stock/transactions', {
        date: form.date,
        materialType: form.materialType,
        transactionType: form.transactionType,
        lotNo: form.lotNo,
        partyName: form.partyName,
        bags: parseFloat(form.bags),
        pricePerBag: form.pricePerBag ? parseFloat(form.pricePerBag) : null,
        remarks: form.remarks || null,
      });
      showToast('Stock entry saved');
      setForm((p) => ({ ...p, lotNo: '', partyName: '', bags: '', pricePerBag: '', remarks: '' }));
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="entry-form-page" id="stock-entry">
      <div className="page-header">
        <h1 className="page-title"><Package size={24} /> Stock Entry</h1>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        <div className="entry-form-grid">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Material Type</label>
            <select value={form.materialType} onChange={(e) => update('materialType', e.target.value)}>
              {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Transaction Type</label>
            <select value={form.transactionType} onChange={(e) => update('transactionType', e.target.value)}>
              {TXN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Lot No.</label>
            <input value={form.lotNo} onChange={(e) => update('lotNo', e.target.value)} placeholder="LOT-2026-001" required />
          </div>
          <div className="form-group">
            <label>Party Name</label>
            <input value={form.partyName} onChange={(e) => update('partyName', e.target.value)} placeholder="ABC Textiles" required />
          </div>
          <div className="form-group">
            <label>Bags</label>
            <input type="number" step="any" value={form.bags} onChange={(e) => update('bags', e.target.value)} placeholder="10" required />
            <span className="auto-calc-label">= {kgs} kg (1 bag = 60 kg)</span>
          </div>
          <div className="form-group">
            <label>Price per Bag (₹)</label>
            <input type="number" step="any" value={form.pricePerBag} onChange={(e) => update('pricePerBag', e.target.value)} placeholder="5000" />
            {totalPrice !== '—' && <span className="auto-calc-label">Total: ₹{totalPrice}</span>}
          </div>
          <div className="form-group full-width">
            <label>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => update('remarks', e.target.value)} placeholder="Optional notes..." rows={2} />
          </div>
        </div>

        <div className="entry-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : <><Check size={16} /> Save Stock Entry</>}
          </button>
        </div>
      </form>

      {toast && <div className={`entry-toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}
