import { useState, useCallback } from 'react';
import { ClipboardEdit, Plus, Trash2, Save, SaveAll, RotateCcw, Check } from 'lucide-react';
import { shiftProductionApi } from '../api/shiftProduction';
import './ProductionEntry.css';

const today = () => new Date().toISOString().split('T')[0];

const emptyRow = () => ({
  _key: crypto.randomUUID(),
  _status: 'unsaved', // unsaved | saving | saved
  _id: null,
  rfNo: '',
  siderName: '',
  count: '',
  stdConstant: '',
  stdHK: '',
  actualHK: '',
  runHrs: '',
  idleSpindles: '0',
  wasteKgs: '',
  autocornerKg: '',
  stoppages: '',
});

/* ── Real-time calculation (mirrors backend formulas) ── */
function calcRow(row, session) {
  const actualHK = parseFloat(row.actualHK) || 0;
  const stdConstant = parseFloat(row.stdConstant) || 0;
  const stdHK = parseFloat(row.stdHK) || 0;
  const wasteKgs = parseFloat(row.wasteKgs) || 0;
  const runHrs = parseFloat(row.runHrs) || 0;
  const idle = parseInt(row.idleSpindles) || 0;
  const shiftHours = parseFloat(session.shiftHours) || 1;
  const totalSpindles = parseInt(session.totalSpindlesPerMachine) || 0;

  const grossKgs = actualHK * stdConstant;
  const netKgs = grossKgs - wasteKgs;
  const wastePct = grossKgs > 0 ? (wasteKgs / grossKgs) * 100 : 0;
  const ws = shiftHours > 0 ? (totalSpindles - idle) * (runHrs / shiftHours) : 0;
  const gps = ws > 0 ? (netKgs * 1000) / ws : 0;
  const efficiency = stdHK > 0 ? (actualHK / stdHK) * 100 : 0;
  const yieldPct = grossKgs > 0 ? (netKgs / grossKgs) * 100 : 0;

  // 2-stage loss (only if autocornerKg entered)
  const autoKg = parseFloat(row.autocornerKg);
  const hasAuto = !isNaN(autoKg) && row.autocornerKg !== '';
  const spinLoss = hasAuto ? grossKgs - autoKg : null;
  const spinLossPct = hasAuto && grossKgs > 0 ? (spinLoss / grossKgs) * 100 : null;
  const autoLoss = hasAuto ? autoKg - netKgs : null;
  const autoLossPct = hasAuto && autoKg > 0 ? (autoLoss / autoKg) * 100 : null;

  return { grossKgs, netKgs, wastePct, ws, gps, efficiency, yieldPct, spinLoss, spinLossPct, autoLoss, autoLossPct, hasAuto };
}

export default function ProductionEntry() {
  const [session, setSession] = useState({
    date: today(),
    shiftHours: '12',
    totalSpindlesPerMachine: '1728',
  });
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [toast, setToast] = useState(null);
  const [batchSaving, setBatchSaving] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const updateSession = (field, value) => {
    setSession((prev) => ({ ...prev, [field]: value }));
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value, _status: 'unsaved' };
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Save Single Row (auto-save) ── */
  const saveRow = async (index) => {
    const row = rows[index];
    if (!row.rfNo || !row.siderName || !row.count || !row.stdConstant || !row.stdHK) {
      showToast('Fill all required fields before saving', 'error');
      return;
    }

    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], _status: 'saving' };
      return next;
    });

    try {
      const payload = {
        date: session.date,
        shiftHours: parseFloat(session.shiftHours),
        totalSpindlesPerMachine: parseInt(session.totalSpindlesPerMachine),
        rfNo: row.rfNo,
        siderName: row.siderName,
        count: row.count,
        stdConstant: parseFloat(row.stdConstant),
        stdHK: parseFloat(row.stdHK),
        actualHK: parseFloat(row.actualHK) || 0,
        runHrs: parseFloat(row.runHrs) || 0,
        idleSpindles: parseInt(row.idleSpindles) || 0,
        wasteKgs: parseFloat(row.wasteKgs) || 0,
        autocornerKg: row.autocornerKg !== '' ? parseFloat(row.autocornerKg) : null,
        stoppages: row.stoppages || null,
      };

      const res = await shiftProductionApi.createSingle(payload);
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], _status: 'saved', _id: res.data?.id || null };
        return next;
      });
      showToast(`Row ${index + 1} saved`);
    } catch (err) {
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], _status: 'unsaved' };
        return next;
      });
      showToast(err.message || 'Save failed', 'error');
    }
  };

  /* ── Save All (batch) ── */
  const saveAll = async () => {
    const unsavedRows = rows.filter((r) => r._status !== 'saved');
    const validRows = unsavedRows.filter((r) => r.rfNo && r.siderName && r.count && r.stdConstant && r.stdHK);

    if (validRows.length === 0) {
      showToast('No valid unsaved rows to submit', 'error');
      return;
    }

    setBatchSaving(true);
    try {
      const payload = {
        date: session.date,
        shiftHours: parseFloat(session.shiftHours),
        totalSpindlesPerMachine: parseInt(session.totalSpindlesPerMachine),
        rows: validRows.map((r) => ({
          rfNo: r.rfNo,
          siderName: r.siderName,
          count: r.count,
          stdConstant: parseFloat(r.stdConstant),
          stdHK: parseFloat(r.stdHK),
          actualHK: parseFloat(r.actualHK) || 0,
          runHrs: parseFloat(r.runHrs) || 0,
          idleSpindles: parseInt(r.idleSpindles) || 0,
          wasteKgs: parseFloat(r.wasteKgs) || 0,
          autocornerKg: r.autocornerKg !== '' ? parseFloat(r.autocornerKg) : null,
          stoppages: r.stoppages || null,
        })),
      };

      await shiftProductionApi.createBatch(payload);

      // Mark all valid rows as saved
      setRows((prev) =>
        prev.map((r) =>
          validRows.find((v) => v._key === r._key) ? { ...r, _status: 'saved' } : r
        )
      );
      showToast(`${validRows.length} entries saved successfully`);
    } catch (err) {
      showToast(err.message || 'Batch save failed', 'error');
    } finally {
      setBatchSaving(false);
    }
  };

  const clearAll = () => {
    setRows([emptyRow(), emptyRow(), emptyRow()]);
  };

  const unsavedCount = rows.filter((r) => r._status === 'unsaved' && r.rfNo).length;
  const savedCount = rows.filter((r) => r._status === 'saved').length;

  return (
    <div className="entry-page" id="production-entry">
      <div className="page-header">
        <h1 className="page-title"><ClipboardEdit size={24} /> Production Entry</h1>
        <span className="badge badge-teal">2026 Standard</span>
      </div>

      {/* ═══ Session Settings ═══ */}
      <div className="session-bar">
        <div className="session-field">
          <label>Date</label>
          <input
            type="date"
            value={session.date}
            onChange={(e) => updateSession('date', e.target.value)}
          />
        </div>
        <div className="session-field">
          <label>Shift Hours</label>
          <select
            value={session.shiftHours}
            onChange={(e) => updateSession('shiftHours', e.target.value)}
          >
            <option value="8">8 Hours</option>
            <option value="12">12 Hours</option>
          </select>
        </div>
        <div className="session-field">
          <label>Total Spindles / Machine</label>
          <select
            value={session.totalSpindlesPerMachine}
            onChange={(e) => updateSession('totalSpindlesPerMachine', e.target.value)}
          >
            <option value="1152">1152 (Standard)</option>
            <option value="1728">1728 (Large)</option>
          </select>
        </div>
      </div>

      {/* ═══ Entry Table ═══ */}
      <div className="entry-table-container">
        <table className="entry-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>R/F No.</th>
              <th>Sider Name</th>
              <th>Count</th>
              <th>STD Const</th>
              <th>STD HK</th>
              <th>Actual HK</th>
              <th>Run Hrs</th>
              <th>Idle Spnl</th>
              <th>Waste Kg</th>
              <th>Auto Kg</th>
              <th>Stoppages</th>
              <th className="calc-header">Prod Kgs</th>
              <th className="calc-header">Act Prod</th>
              <th className="calc-header">Waste %</th>
              <th className="calc-header">Wkd Spnl</th>
              <th className="calc-header">G/Spindle</th>
              <th className="calc-header">Eff %</th>
              <th className="calc-header">Yield %</th>
              <th className="calc-header">Spin Loss</th>
              <th className="calc-header">Auto Loss</th>
              <th style={{ width: 70 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const c = calcRow(row, session);
              return (
                <tr key={row._key} style={{ animationDelay: `${i * 0.03}s` }}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <span className={`row-status ${row._status}`} title={row._status} />
                  </td>
                  <td><input value={row.rfNo} onChange={(e) => updateRow(i, 'rfNo', e.target.value)} placeholder="RF-1" /></td>
                  <td><input value={row.siderName} onChange={(e) => updateRow(i, 'siderName', e.target.value)} placeholder="Name" /></td>
                  <td><input value={row.count} onChange={(e) => updateRow(i, 'count', e.target.value)} placeholder="41s" className="input-sm" /></td>
                  <td><input value={row.stdConstant} onChange={(e) => updateRow(i, 'stdConstant', e.target.value)} placeholder="0.0" className="input-sm" type="number" step="any" /></td>
                  <td><input value={row.stdHK} onChange={(e) => updateRow(i, 'stdHK', e.target.value)} placeholder="0.0" className="input-sm" type="number" step="any" /></td>
                  <td><input value={row.actualHK} onChange={(e) => updateRow(i, 'actualHK', e.target.value)} placeholder="0.0" className="input-sm" type="number" step="any" /></td>
                  <td><input value={row.runHrs} onChange={(e) => updateRow(i, 'runHrs', e.target.value)} placeholder="0.0" className="input-sm" type="number" step="any" /></td>
                  <td><input value={row.idleSpindles} onChange={(e) => updateRow(i, 'idleSpindles', e.target.value)} placeholder="0" className="input-sm" type="number" /></td>
                  <td><input value={row.wasteKgs} onChange={(e) => updateRow(i, 'wasteKgs', e.target.value)} placeholder="0.0" className="input-sm" type="number" step="any" /></td>
                  <td><input value={row.autocornerKg} onChange={(e) => updateRow(i, 'autocornerKg', e.target.value)} placeholder="—" className="input-sm" type="number" step="any" /></td>
                  <td><input value={row.stoppages} onChange={(e) => updateRow(i, 'stoppages', e.target.value)} placeholder="—" /></td>
                  {/* Auto-calculated columns */}
                  <td className="calc-cell highlight">{c.grossKgs > 0 ? c.grossKgs.toFixed(2) : '—'}</td>
                  <td className="calc-cell good">{c.netKgs > 0 ? c.netKgs.toFixed(2) : '—'}</td>
                  <td className="calc-cell warn">{c.grossKgs > 0 ? c.wastePct.toFixed(2) + '%' : '—'}</td>
                  <td className="calc-cell info">{c.ws > 0 ? c.ws.toFixed(1) : '—'}</td>
                  <td className="calc-cell good">{c.gps > 0 ? c.gps.toFixed(2) : '—'}</td>
                  <td className="calc-cell highlight">{c.efficiency > 0 ? c.efficiency.toFixed(1) + '%' : '—'}</td>
                  <td className="calc-cell good">{c.grossKgs > 0 ? c.yieldPct.toFixed(1) + '%' : '—'}</td>
                  <td className="calc-cell warn">{c.hasAuto && c.spinLossPct !== null ? c.spinLossPct.toFixed(2) + '%' : '—'}</td>
                  <td className="calc-cell warn">{c.hasAuto && c.autoLossPct !== null ? c.autoLossPct.toFixed(2) + '%' : '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn save-btn" onClick={() => saveRow(i)} title="Save row" disabled={row._status === 'saved'}>
                        <Save size={14} />
                      </button>
                      <button className="row-btn" onClick={() => removeRow(i)} title="Remove row">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ Actions Bar ═══ */}
      <div className="entry-actions">
        <div className="entry-actions-left">
          <button className="btn" onClick={addRow}><Plus size={16} /> Add Row</button>
          <button className="btn" onClick={clearAll}><RotateCcw size={16} /> Clear All</button>
          <span className="entry-count">
            {rows.length} rows • {savedCount} saved • {unsavedCount} pending
          </span>
        </div>
        <div className="entry-actions-right">
          <button
            className="btn btn-primary"
            onClick={saveAll}
            disabled={batchSaving || unsavedCount === 0}
          >
            {batchSaving ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Saving...</>
            ) : (
              <><SaveAll size={16} /> Save All ({unsavedCount})</>
            )}
          </button>
        </div>
      </div>

      {/* ═══ Toast ═══ */}
      {toast && (
        <div className={`entry-toast ${toast.type === 'error' ? 'error' : ''}`}>
          {toast.type !== 'error' && <Check size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
