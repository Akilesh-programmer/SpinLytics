import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { stockApi } from '../api/stock';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import DateField from '../components/DateField';
import SubmitButton from '../components/SubmitButton';
import CalcCard from '../components/CalcCard';
import Toast from '../components/Toast';
import ScreenHeader from '../components/ScreenHeader';

const MATERIAL_OPTIONS = [
  { value: 'COTTON', label: 'Cotton' },
  { value: 'VISCOSE', label: 'Viscose' },
  { value: 'FIBER', label: 'Fiber' },
  { value: 'EXCEL', label: 'Excel' },
  { value: 'YARN', label: 'Yarn' },
  { value: 'WASTE', label: 'Waste' },
];

const TXN_OPTIONS = [
  { value: 'PURCHASE', label: 'Purchase (Inflow)' },
  { value: 'ISSUE', label: 'Issue (Outflow)' },
  { value: 'RETURN', label: 'Return (Inflow)' },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function StockScreen() {
  const [form, setForm] = useState({
    date: today(),
    materialType: 'COTTON',
    transactionType: 'PURCHASE',
    lotNo: '',
    partyName: '',
    bags: '',
    pricePerBag: '',
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
  const bags = n(form.bags);
  const kgs = bags * 60;
  const price = n(form.pricePerBag);
  const totalValue = bags * price;

  const calcItems = bags > 0 ? [
    { label: 'Computed KG', value: kgs.toFixed(1), unit: 'kg', color: Colors.teal },
    { label: 'Bags', value: bags.toFixed(1), color: Colors.blue },
    ...(price > 0 ? [
      { label: 'Price/Bag', value: `₹${price.toFixed(2)}`, color: Colors.amber },
      { label: 'Total Value', value: `₹${totalValue.toFixed(2)}`, color: Colors.emerald },
    ] : []),
  ] : [];

  const validate = () => {
    const e = {};
    if (!form.lotNo.trim()) e.lotNo = 'Required';
    if (!form.partyName.trim()) e.partyName = 'Required';
    if (!form.bags || n(form.bags) <= 0) e.bags = 'Required (> 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await stockApi.create({
        date: form.date,
        materialType: form.materialType,
        transactionType: form.transactionType,
        lotNo: form.lotNo.trim(),
        partyName: form.partyName.trim(),
        bags: n(form.bags),
        pricePerBag: price > 0 ? price : null,
        remarks: form.remarks || null,
      });
      setToast({ visible: true, message: 'Stock transaction saved!', type: 'success' });
      setForm((p) => ({
        ...p, lotNo: '', partyName: '', bags: '', pricePerBag: '', remarks: '',
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
          <ScreenHeader icon="cube-outline" title="Stock Transaction" description="Record purchases, issues, dispatches & returns. 1 bag = 60 kg auto-computed." color="#3b82f6" />
          <DateField label="Date" value={form.date} onChange={(v) => set('date', v)} />
          <SelectField label="Material Type" value={form.materialType} onSelect={(v) => set('materialType', v)} options={MATERIAL_OPTIONS} />
          <SelectField label="Transaction Type" value={form.transactionType} onSelect={(v) => set('transactionType', v)} options={TXN_OPTIONS} />
          <FormField label="Lot No" value={form.lotNo} onChangeText={(v) => set('lotNo', v)} placeholder="Enter lot number" error={errors.lotNo} />
          <FormField label="Party Name" value={form.partyName} onChangeText={(v) => set('partyName', v)} placeholder="Enter party name" error={errors.partyName} />
          <FormField label="Bags" value={form.bags} onChangeText={(v) => set('bags', v)} placeholder="0" keyboardType="decimal-pad" error={errors.bags} info={bags > 0 ? `= ${kgs.toFixed(1)} kg (1 bag = 60 kg)` : null} />
          <FormField label="Price per Bag" value={form.pricePerBag} onChangeText={(v) => set('pricePerBag', v)} placeholder="Optional" keyboardType="decimal-pad" suffix="₹" />
          <FormField label="Remarks" value={form.remarks} onChangeText={(v) => set('remarks', v)} placeholder="Optional notes..." multiline />

          {calcItems.length > 0 && <CalcCard items={calcItems} />}

          <SubmitButton title="Save Stock Transaction" onPress={submit} loading={loading} />
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
