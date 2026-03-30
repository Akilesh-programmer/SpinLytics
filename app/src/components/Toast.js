import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function Toast({ visible, message, type = 'success', onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? Colors.emeraldDim : Colors.redDim;
  const iconColor = isSuccess ? Colors.emerald : Colors.red;
  const iconName = isSuccess ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, transform: [{ translateY }], opacity }]}>
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={[styles.text, { color: iconColor }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1000,
    elevation: 10,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
