import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../theme/colors';

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(d) {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DateField({ label, value, onChange }) {
  const date = value ? new Date(value + 'T00:00:00') : new Date();

  const goDay = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    onChange(formatDate(d));
  };

  const setToday = () => {
    onChange(formatDate(new Date()));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(-1)}>
          <Ionicons name="chevron-back" size={20} color={Colors.teal} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateDisplay} onPress={setToday} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={16} color={Colors.teal} style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{formatDisplay(date)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDay(1)}>
          <Ionicons name="chevron-forward" size={20} color={Colors.teal} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    width: 40,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
