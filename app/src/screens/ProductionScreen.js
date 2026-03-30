import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { productionApi } from '../api/production';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import DateField from '../components/DateField';
import SubmitButton from '../components/SubmitButton';
import CalcCard from '../components/CalcCard';
import Toast from '../components/Toast';
import ScreenHeader from '../components/ScreenHeader';

const FRAME_OPTIONS = [
  { value: 'FRAME_41', label: 'Frame 41' },
  { value: 'FRAME_47', label: 'Frame 47' },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProductionScreen() {
  const [form, setForm] = useState({
    date: today(),
    frameNumber: 'FRAME_41',
    productionKg: '',
    autocornerProductionKg: '',
    packingKg: '',
    ebUnits: '',
    noOfSpindles: '',
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const n = (v) => (v === '' ? 0 : parseFloat(v) || 0);

  // Live calculations
  const prod = n(form.productionKg);
  const auto = n(form.autocornerProductionKg);
  const pack = n(form.packingKg);
  const eb = n(form.ebUnits);
  const spindles = parseInt(form.noOfSpindles) || 0;

  const spinLoss = prod - auto;
  const spinLossPct = prod > 0 ? ((spinLoss / prod) * 100).toFixed(2) : '0';
  const autoLoss = auto - pack;
  const autoLossPct = auto > 0 ? ((autoLoss / auto) * 100).toFixed(2) : '0';
  const ukgVal = prod > 0 ? (eb / prod).toFixed(4) : '0';
  const gpsVal = spindles > 0 ? (prod / spindles).toFixed(4) : '0';
  const yieldPct = prod > 0 ? ((pack / prod) * 100).toFixed(1) : '0';

  const calcItems = prod > 0 ? [
    { label: 'Spinning Loss', value: `${spinLossPct}%`, color: Colors.amber },
    { label: 'Spinning Loss KG', value: spinLoss.toFixed(1), unit: 'kg', color: Colors.amber },
    { label: 'Autocorner Loss', value: `${autoLossPct}%`, color: Colors.red },
    { label: 'Autocorner Loss KG', value: autoLoss.toFixed(1), unit: 'kg', color: Colors.red },
    { label: 'UKG', value: ukgVal, color: Colors.purple },
    { label: 'GPS', value: gpsVal, color: Colors.emerald },
    { label: 'Overall Yield', value: `${yieldPct}%`, color: Colors.teal },
    { label: 'Computed KG', value: `${(pack).toFixed(1)} / ${prod.toFixed(1)}`, color: Colors.blue },
  ] : [];

  const validate = () => {
    const e = {};
    if (!form.productionKg || n(form.productionKg) <= 0) e.productionKg = 'Required (> 0)';
    if (!form.autocornerProductionKg || n(form.autocornerProductionKg) <= 0) e.autocornerProductionKg = 'Required (> 0)';
    if (form.packingKg === '') e.packingKg = 'Required';
    if (n(form.autocornerProductionKg) > n(form.productionKg)) e.autocornerProductionKg = 'Cannot exceed production';
    if (n(form.packingKg) > n(form.autocornerProductionKg)) e.packingKg = 'Cannot exceed autocorner';
    if (!form.ebUnits) e.ebUnits = 'Required';
    if (!form.noOfSpindles || parseInt(form.noOfSpindles) <= 0) e.noOfSpindles = 'Required (> 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await productionApi.create({
        date: form.date,
        frameNumber: form.frameNumber,
        productionKg: n(form.productionKg),
        autocornerProductionKg: n(form.autocornerProductionKg),
        packingKg: n(form.packingKg),
        ebUnits: n(form.ebUnits),
        noOfSpindles: parseInt(form.noOfSpindles),
        remarks: form.remarks || null,
      });
      setToast({ visible: true, message: 'Production entry saved!', type: 'success' });
      // Reset numeric fields, keep date and frame
      setForm((p) => ({
        ...p,
        productionKg: '', autocornerProductionKg: '', packingKg: '',
        ebUnits: '', noOfSpindles: '', remarks: '',
      }));
    } catch (e) {
      setToast({ visible: true, message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Toast {...toast} onHide={() => setToast((p) => ({ ...p, visible: false }))} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader icon="build-outline" title="Production Entry" description="Enter daily frame-wise production, autocorner, packing, EB units and spindles data." color="#00d4aa" />
          <DateField label="Date" value={form.date} onChange={(v) => set('date', v)} />
          <SelectField label="Frame Number" value={form.frameNumber} onSelect={(v) => set('frameNumber', v)} options={FRAME_OPTIONS} />
          <FormField label="Production" value={form.productionKg} onChangeText={(v) => set('productionKg', v)} placeholder="0.000" keyboardType="decimal-pad" suffix="kg" error={errors.productionKg} />
          <FormField label="Autocorner Production" value={form.autocornerProductionKg} onChangeText={(v) => set('autocornerProductionKg', v)} placeholder="0.000" keyboardType="decimal-pad" suffix="kg" error={errors.autocornerProductionKg} />
          <FormField label="Packing" value={form.packingKg} onChangeText={(v) => set('packingKg', v)} placeholder="0.000" keyboardType="decimal-pad" suffix="kg" error={errors.packingKg} />
          <FormField label="EB Units" value={form.ebUnits} onChangeText={(v) => set('ebUnits', v)} placeholder="0.000" keyboardType="decimal-pad" error={errors.ebUnits} />
          <FormField label="No. of Spindles" value={form.noOfSpindles} onChangeText={(v) => set('noOfSpindles', v)} placeholder="0" keyboardType="number-pad" error={errors.noOfSpindles} />
          <FormField label="Remarks" value={form.remarks} onChangeText={(v) => set('remarks', v)} placeholder="Optional notes..." multiline />
          
          {calcItems.length > 0 && <CalcCard items={calcItems} />}
          
          <SubmitButton title="Save Production Entry" onPress={submit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 40 },
});
