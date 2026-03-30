import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../theme/colors';

export default function CalcCard({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Live Calculations</Text>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <View style={styles.item} key={i}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Text style={[styles.itemValue, item.color && { color: item.color }]}>
              {item.value}
              {item.unit && <Text style={styles.itemUnit}> {item.unit}</Text>}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    width: '50%',
    marginBottom: Spacing.md,
  },
  itemLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  itemValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textHeading,
  },
  itemUnit: {
    fontSize: FontSize.sm,
    fontWeight: '400',
    color: Colors.textMuted,
  },
});
