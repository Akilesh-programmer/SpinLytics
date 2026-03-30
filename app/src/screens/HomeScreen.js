import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, Radius } from '../theme/colors';
import { dashboardApi } from '../api/dashboard';
import { stockApi } from '../api/stock';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.xl * 2 - Spacing.md * 2) / 3;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayDisplay() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

const QUICK_ACTIONS = [
  { key: 'Production', icon: 'build-outline', color: Colors.teal, screen: 'Production' },
  { key: 'Stock', icon: 'cube-outline', color: Colors.blue, screen: 'Stock' },
  { key: 'Packing', icon: 'gift-outline', color: Colors.purple, screen: 'Packing' },
  { key: 'Dispatch', icon: 'send-outline', color: Colors.amber, screen: 'More', nested: 'DispatchEntry' },
  { key: 'EB Entry', icon: 'flash-outline', color: Colors.cyan, screen: 'More', nested: 'EBEntry' },
];

export default function HomeScreen({ navigation }) {
  const [daily, setDaily] = useState(null);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyData, stockData] = await Promise.allSettled([
        dashboardApi.getDaily(today()),
        stockApi.getCurrentStock(),
      ]);
      if (dailyData.status === 'fulfilled') setDaily(dailyData.value);
      if (stockData.status === 'fulfilled') setStock(stockData.value || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const totals = daily?.totals;
  const frames = daily?.frames || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={Colors.teal} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>SpinLytics</Text>
          <Text style={styles.subtitle}>{todayDisplay()}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.dot, { backgroundColor: error ? Colors.red : Colors.emerald }]} />
          <Text style={[styles.statusText, { color: error ? Colors.red : Colors.emerald }]}>{error ? 'Offline' : 'Online'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Entry</Text>
      <View style={styles.quickRow}>
        {QUICK_ACTIONS.slice(0, 3).map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.quickCard, { width: CARD_W }]}
            onPress={() => {
              if (action.nested) {
                navigation.navigate(action.screen, { screen: action.nested });
              } else {
                navigation.navigate(action.screen);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.quickLabel}>{action.key}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.quickRow, { marginTop: Spacing.md }]}>
        {QUICK_ACTIONS.slice(3).map((action) => (
          <TouchableOpacity
            key={action.key}
            style={[styles.quickCard, { width: CARD_W }]}
            onPress={() => {
              if (action.nested) {
                navigation.navigate(action.screen, { screen: action.nested });
              } else {
                navigation.navigate(action.screen);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.quickLabel}>{action.key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Summary */}
      <Text style={styles.sectionTitle}>Today's Production</Text>
      {totals ? (
        <View style={styles.summaryCard}>
          {/* Row 1 */}
          <View style={styles.summaryRow}>
            <SummaryItem icon="trending-up-outline" label="Total Production" value={`${Number(totals.totalProductionKg).toFixed(1)}`} unit="kg" color={Colors.teal} />
            <View style={styles.divider} />
            <SummaryItem icon="cube-outline" label="Total Packing" value={`${Number(totals.totalPackingKg).toFixed(1)}`} unit="kg" color={Colors.emerald} />
          </View>
          <View style={styles.rowSep} />
          {/* Row 2 */}
          <View style={styles.summaryRow}>
            <SummaryItem icon="arrow-down-outline" label="Spinning Loss" value={`${totals.spinningLossPercent}`} unit="%" color={Colors.amber} />
            <View style={styles.divider} />
            <SummaryItem icon="arrow-down-outline" label="Autocorner Loss" value={`${totals.autocornerLossPercent}`} unit="%" color={Colors.red} />
          </View>
          <View style={styles.rowSep} />
          {/* Row 3 */}
          <View style={styles.summaryRow}>
            <SummaryItem icon="flash-outline" label="UKG" value={totals.ukg} color={Colors.purple} />
            <View style={styles.divider} />
            <SummaryItem icon="speedometer-outline" label="GPS" value={totals.gps} color={Colors.cyan} />
          </View>
          <View style={styles.rowSep} />
          {/* Row 4 */}
          <View style={styles.summaryRow}>
            <SummaryItem icon="flash-outline" label="EB Units" value={`${Number(totals.totalEBUnits).toFixed(1)}`} color={Colors.amber} />
            <View style={styles.divider} />
            <SummaryItem icon="settings-outline" label="Spindles" value={`${totals.totalSpindles}`} color={Colors.blue} />
          </View>

          {/* Frame breakdown */}
          {frames.length > 0 && (
            <>
              <View style={[styles.rowSep, { marginTop: Spacing.md }]} />
              <Text style={styles.frameTitle}>Frame Breakdown</Text>
              {frames.map((f) => (
                <View key={f.id} style={styles.frameRow}>
                  <View style={[styles.frameBadge, { backgroundColor: f.frameNumber === 'FRAME_41' ? Colors.tealDim : Colors.blueDim }]}>
                    <Text style={[styles.frameBadgeText, { color: f.frameNumber === 'FRAME_41' ? Colors.teal : Colors.blue }]}>
                      {f.frameNumber === 'FRAME_41' ? 'F41' : 'F47'}
                    </Text>
                  </View>
                  <View style={styles.frameStats}>
                    <Text style={styles.frameStat}>{Number(f.productionKg).toFixed(1)} kg</Text>
                    <Text style={styles.frameStatSub}>Spin: {f.calculated.spinningLossPercent}%  •  Auto: {f.calculated.autocornerLossPercent}%  •  GPS: {f.calculated.gps}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="analytics-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No production data for today</Text>
          <Text style={styles.emptySubtext}>Tap "Production" above to add an entry</Text>
        </View>
      )}

      {/* Stock Overview */}
      {stock.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Current Stock</Text>
          <View style={styles.stockRow}>
            {stock.map((s) => (
              <View style={[styles.stockItem, { width: CARD_W }]} key={s.materialType}>
                <Text style={styles.stockMaterial}>{s.materialType}</Text>
                <Text style={styles.stockValue}>{Number(s.currentStockKg).toFixed(0)}</Text>
                <Text style={styles.stockUnit}>kg</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color={Colors.amber} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function SummaryItem({ icon, label, value, unit, color }) {
  return (
    <View style={styles.summaryItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name={icon} size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, { color }]}>
        {value}
        {unit && <Text style={styles.summaryUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xxl, paddingTop: Spacing.md,
  },
  brandName: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textHeading, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  sectionTitle: {
    fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.md, marginTop: Spacing.xl, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  quickRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  quickCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.lg,
    alignItems: 'center', marginRight: Spacing.md,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  summaryCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.lg,
  },
  summaryRow: { flexDirection: 'row', paddingVertical: Spacing.sm },
  summaryItem: { flex: 1 },
  divider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  rowSep: { height: 1, backgroundColor: Colors.border },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '800' },
  summaryUnit: { fontSize: FontSize.sm, fontWeight: '400' },
  frameTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.sm },
  frameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  frameBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.sm, marginRight: Spacing.md },
  frameBadgeText: { fontSize: FontSize.sm, fontWeight: '800' },
  frameStats: { flex: 1 },
  frameStat: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textHeading },
  frameStatSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, paddingVertical: 48, alignItems: 'center',
  },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6 },
  stockRow: { flexDirection: 'row', flexWrap: 'wrap' },
  stockItem: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.md, alignItems: 'center',
    marginRight: Spacing.md, marginBottom: Spacing.md,
  },
  stockMaterial: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' },
  stockValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.teal },
  stockUnit: { fontSize: FontSize.xs, color: Colors.textMuted },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.amberDim,
    borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg,
    borderWidth: 1, borderColor: Colors.amber + '40',
  },
  errorText: { fontSize: FontSize.sm, color: Colors.amber, marginLeft: Spacing.sm, flex: 1 },
});
