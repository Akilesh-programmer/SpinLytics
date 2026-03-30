import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../theme/colors';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  editable = true,
  suffix,
  error,
  info,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError, !editable && styles.inputDisabled]}>
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          numberOfLines={multiline ? 3 : 1}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {info && !error && <Text style={styles.info}>{info}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md + 2,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  suffix: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.red,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  info: {
    fontSize: FontSize.xs,
    color: Colors.teal,
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.red,
    marginTop: Spacing.xs,
  },
});
