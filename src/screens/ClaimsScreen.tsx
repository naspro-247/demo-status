import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { outstandingBalance } from '../domain/claims';
import { formatMoney } from '../domain/money';
import type { Claim } from '../domain/types';
import { findFacility } from '../state/reducer';
import { useStore } from '../state/store';
import { StatusBadge } from '../ui/StatusBadge';
import { colors } from '../ui/theme';

export function ClaimsScreen({ onOpenClaim }: { onOpenClaim: (claimId: string) => void }) {
  const { state } = useStore();

  const renderItem = ({ item }: { item: Claim }) => {
    const facility = findFacility(state, item.facilityId);
    return (
      <Pressable
        style={styles.row}
        onPress={() => onOpenClaim(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open claim ${item.reference}`}
      >
        <View style={styles.rowHeader}>
          <Text style={styles.reference}>{item.reference}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.facility}>{facility?.name ?? 'Unknown facility'}</Text>
        <View style={styles.amounts}>
          <Text style={styles.claimed}>Claimed {formatMoney(item.claimedAmount)}</Text>
          {outstandingBalance(item) > 0 && (
            <Text style={styles.outstanding}>
              {formatMoney(outstandingBalance(item))} outstanding
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={state.claims}
      keyExtractor={(claim) => claim.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No claims yet. Add one to get started.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: 16, fontWeight: '700', color: colors.text },
  facility: { fontSize: 13, color: colors.muted },
  amounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  claimed: { fontSize: 13, color: colors.text },
  outstanding: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
