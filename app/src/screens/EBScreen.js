import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { Colors, Spacing } from '../theme/colors';
import { ebApi } from '../api/eb';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import SubmitButton from '../components/SubmitButton';
import CalcCard from '../components/CalcCard';
import Toast from '../components/Toast';
import ScreenHeader from '../components/ScreenHeader';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const MONTH_OPTIONS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const y = currentYear - 3 + i;
  return { value: String(y), label: String(y) };
});

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function EBScreen() {
  const [form, setForm] = useState({
    month: String(currentMonth),
    year: String(currentYear),
    openingUnits: '',
    closingUnits: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});
  const [openingLocked, setOpeningLocked] = useState(false);
  const [openingSource, setOpeningSource] = useState(null); // info text about where opening came from
  const [fetchingPrev, setFetchingPrev] = useState(false);

  const set = (key, val) => {
    // Don't allow editing opening if it's locked (auto-populated from previous month)
    if (key === 'openingUnits' && openingLocked) return;
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  // Fetch previous month's closing whenever month or year changes
  const fetchPreviousClosing = useCallback(async (month, year) => {
    setFetchingPrev(true);
    try {
      const result = await ebApi.getPreviousClosing(year, month);
      if (result.found) {
        const prevClosing = String(result.closingUnits);
        setForm((p) => ({ ...p, openingUnits: prevClosing }));
        setOpeningLocked(true);
        setOpeningSource(
          `Auto-filled from ${MONTH_NAMES[result.previousMonth]} ${result.previousYear} closing (${prevClosing})`
        );
      } else {
        // No previous entry found — let user enter manually
        setForm((p) => ({ ...p, openingUnits: '' }));
        setOpeningLocked(false);
        setOpeningSource(
          `No EB entry found for ${MONTH_NAMES[result.previousMonth]} ${result.previousYear}. Enter opening manually.`
        );
      }
    } catch (e) {
      // API error — let user enter manually
      setOpeningLocked(false);
      setOpeningSource(null);
    } finally {
      setFetchingPrev(false);
    }
  }, []);

  // Fetch on mount and whenever month/year changes
  useEffect(() => {
    fetchPreviousClosing(parseInt(form.month), parseInt(form.year));
  }, [form.month, form.year, fetchPreviousClosing]);

  const n = (v) => (v === '' ? 0 : parseFloat(v) || 0);
  const opening = n(form.openingUnits);
  const closing = n(form.closingUnits);
  const consumed = closing - opening;

  const calcItems = (opening > 0 || closing > 0) ? [
    { label: 'Opening Units', value: opening.toFixed(1), color: Colors.blue },
    { label: 'Closing Units', value: closing.toFixed(1), color: Colors.purple },
    { label: 'EB Consumed', value: consumed.toFixed(1), unit: 'units', color: consumed >= 0 ? Colors.teal : Colors.red },
  ] : [];

  const validate = () => {
    const e = {};
    if (form.openingUnits === '' || n(form.openingUnits) < 0) e.openingUnits = 'Required (≥ 0)';
    if (form.closingUnits === '' || n(form.closingUnits) < 0) e.closingUnits = 'Required (≥ 0)';
    if (n(form.closingUnits) < n(form.openingUnits)) e.closingUnits = 'Must be ≥ opening units';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await ebApi.create({
        month: parseInt(form.month),
        year: parseInt(form.year),
        openingUnits: n(form.openingUnits),
        closingUnits: n(form.closingUnits),
      });
      setToast({ visible: true, message: 'EB entry saved!', type: 'success' });
      setForm((p) => ({ ...p, openingUnits: '', closingUnits: '' }));
      setOpeningLocked(false);
      setOpeningSource(null);
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
          <ScreenHeader icon="flash-outline" title="EB Entry" description="Record monthly electricity opening & closing meter readings. EB consumed = Closing - Opening." color="#06b6d4" />
          <SelectField label="Month" value={form.month} onSelect={(v) => setForm((p) => ({ ...p, month: v, openingUnits: '', closingUnits: '' }))} options={MONTH_OPTIONS} />
          <SelectField label="Year" value={form.year} onSelect={(v) => setForm((p) => ({ ...p, year: v, openingUnits: '', closingUnits: '' }))} options={YEAR_OPTIONS} />

          <FormField
            label={openingLocked ? "Opening Units (auto-filled)" : "Opening Units"}
            value={form.openingUnits}
            onChangeText={(v) => set('openingUnits', v)}
            placeholder="0.000"
            keyboardType="decimal-pad"
            error={errors.openingUnits}
            editable={!openingLocked}
            info={fetchingPrev ? 'Loading previous month...' : openingSource}
          />
          {openingLocked && (
            <Text
              style={styles.unlockHint}
              onPress={() => { setOpeningLocked(false); setOpeningSource('Manually editing opening units.'); }}
            >
              ✏️ Tap to edit opening manually
            </Text>
          )}

          <FormField label="Closing Units" value={form.closingUnits} onChangeText={(v) => set('closingUnits', v)} placeholder="0.000" keyboardType="decimal-pad" error={errors.closingUnits} />

          {calcItems.length > 0 && <CalcCard items={calcItems} />}

          <SubmitButton title="Save EB Entry" onPress={submit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  unlockHint: {
    color: Colors.cyan || '#06b6d4',
    fontSize: 13,
    marginTop: -4,
    marginBottom: 12,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
});
