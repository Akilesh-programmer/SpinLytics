import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { packingApi } from '../api/packing';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import DateField from '../components/DateField';
import SubmitButton from '../components/SubmitButton';
import CalcCard from '../components/CalcCard';
import Toast from '../components/Toast';
import ScreenHeader from '../components/ScreenHeader';

const SOURCE_OPTIONS = [
  { value: 'AUTOCORNER', label: 'Autocorner' },
  { value: 'PRODUCTION', label: 'Production' },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PackingScreen() {
  const [form, setForm] = useState({
    date: today(),
    source: 'AUTOCORNER',
    yarnType: '',
    bags: '',
    lotNo: '',
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

  const calcItems = bags > 0 ? [
    { label: 'Computed KG', value: kgs.toFixed(1), unit: 'kg', color: Colors.teal },
    { label: 'Bags', value: bags.toFixed(1), color: Colors.blue },
  ] : [];

  const validate = () => {
    const e = {};
    if (!form.yarnType.trim()) e.yarnType = 'Yarn type is required';
    if (!form.bags || n(form.bags) <= 0) e.bags = 'Required (> 0)';
    if (!form.lotNo.trim()) e.lotNo = 'Lot number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await packingApi.create({
        date: form.date,
        source: form.source,
        yarnType: form.yarnType.trim(),
        bags: n(form.bags),
        lotNo: form.lotNo.trim(),
        remarks: form.remarks || null,
      });
      setToast({ visible: true, message: 'Packing entry saved!', type: 'success' });
      setForm((p) => ({ ...p, yarnType: '', bags: '', lotNo: '', remarks: '' }));
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
          <ScreenHeader icon="gift-outline" title="Packing Entry" description="Record packing from autocorner or production. Updates stock and feeds dispatch." color="#8b5cf6" />
          <DateField label="Date" value={form.date} onChange={(v) => set('date', v)} />
          <SelectField label="Source" value={form.source} onSelect={(v) => set('source', v)} options={SOURCE_OPTIONS} />
          <FormField label="Yarn Type" value={form.yarnType} onChangeText={(v) => set('yarnType', v)} placeholder="e.g., Cotton 40s" error={errors.yarnType} />
          <FormField label="Bags" value={form.bags} onChangeText={(v) => set('bags', v)} placeholder="0" keyboardType="decimal-pad" error={errors.bags} info={bags > 0 ? `= ${kgs.toFixed(1)} kg` : null} />
          <FormField label="Lot No" value={form.lotNo} onChangeText={(v) => set('lotNo', v)} placeholder="Enter lot number" error={errors.lotNo} />
          <FormField label="Remarks" value={form.remarks} onChangeText={(v) => set('remarks', v)} placeholder="Optional notes..." multiline />

          {calcItems.length > 0 && <CalcCard items={calcItems} />}

          <SubmitButton title="Save Packing Entry" onPress={submit} loading={loading} />
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
