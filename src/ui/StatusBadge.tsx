import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClaimStatus } from '../domain/types';
import { statusMeta } from './theme';

export function StatusBadge({ status }: { status: ClaimStatus }) {
  const meta = statusMeta(status);
  return (
    <View style={[styles.badge, { backgroundColor: meta.color }]} accessibilityRole="text">
      <Text style={styles.label}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
