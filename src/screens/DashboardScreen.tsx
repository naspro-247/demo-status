import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { paymentRate, summarizeByFacility, summarizeClaims } from '../domain/analytics';
import { formatMoney } from '../domain/money';
import { useStore } from '../state/store';
import { colors } from '../ui/theme';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const { state } = useStore();
  const summary = summarizeClaims(state.claims);
  const byFacility = summarizeByFacility(state.facilities, state.claims);
  const rate = Math.round(paymentRate(state.claims) * 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Overview</Text>
      <View style={styles.grid}>
        <StatCard label="Total claimed" value={formatMoney(summary.totalClaimed)} />
        <StatCard label="Total approved" value={formatMoney(summary.totalApproved)} />
        <StatCard label="Total paid" value={formatMoney(summary.totalPaid)} />
        <StatCard label="Outstanding" value={formatMoney(summary.totalOutstanding)} />
      </View>

      <Text style={styles.rate} accessibilityRole="text">
        {rate}% of approved value paid
      </Text>

      <Text style={styles.heading}>By facility</Text>
      {byFacility.map((facility) => (
        <View key={facility.facilityId} style={styles.facilityRow}>
          <View style={styles.facilityInfo}>
            <Text style={styles.facilityName}>{facility.facilityName}</Text>
            <Text style={styles.facilityMeta}>
              {facility.claimCount} claim{facility.claimCount === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.facilityAmounts}>
            <Text style={styles.outstanding}>{formatMoney(facility.totalOutstanding)}</Text>
            <Text style={styles.facilityMeta}>outstanding</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  cardLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  rate: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  facilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  facilityInfo: { flexShrink: 1 },
  facilityName: { fontSize: 15, fontWeight: '600', color: colors.text },
  facilityMeta: { fontSize: 12, color: colors.muted },
  facilityAmounts: { alignItems: 'flex-end' },
  outstanding: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
