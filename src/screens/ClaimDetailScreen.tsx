import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { outstandingBalance, totalPaid } from '../domain/claims';
import { formatMoney, parseMoney } from '../domain/money';
import { findClaim, findFacility } from '../state/reducer';
import { useStore } from '../state/store';
import { StatusBadge } from '../ui/StatusBadge';
import { colors } from '../ui/theme';

function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'success';
}) {
  const background =
    variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : colors.primary;
  return (
    <Pressable
      style={[styles.button, { backgroundColor: background }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function ClaimDetailScreen({ claimId, onBack }: { claimId: string; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const claim = findClaim(state, claimId);
  const [paymentInput, setPaymentInput] = useState('');

  if (!claim) {
    return (
      <View style={styles.container}>
        <Text style={styles.missing}>This claim no longer exists.</Text>
        <Button label="Back" onPress={onBack} />
      </View>
    );
  }

  const facility = findFacility(state, claim.facilityId);

  const run = (fn: () => void) => {
    try {
      fn();
    } catch (error) {
      Alert.alert('Action failed', error instanceof Error ? error.message : String(error));
    }
  };

  const submitPayment = () => {
    const amount = parseMoney(paymentInput);
    if (amount === null || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive payment amount.');
      return;
    }
    run(() => {
      dispatch({ type: 'RECORD_PAYMENT', claimId, amount });
      setPaymentInput('');
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to claims">
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.reference}>{claim.reference}</Text>
        <StatusBadge status={claim.status} />
      </View>
      <Text style={styles.facility}>{facility?.name ?? 'Unknown facility'}</Text>

      <View style={styles.section}>
        <Row label="Claimed" value={formatMoney(claim.claimedAmount)} />
        <Row label="Approved" value={formatMoney(claim.approvedAmount)} />
        <Row label="Paid" value={formatMoney(totalPaid(claim))} />
        <Row label="Outstanding" value={formatMoney(outstandingBalance(claim))} />
      </View>

      <View style={styles.actions}>
        {claim.status === 'submitted' && (
          <>
            <Button label="Start review" onPress={() => run(() => dispatch({ type: 'REVIEW_CLAIM', claimId }))} />
            <Button label="Reject" variant="danger" onPress={() => run(() => dispatch({ type: 'REJECT_CLAIM', claimId }))} />
          </>
        )}
        {claim.status === 'under_review' && (
          <>
            <Button
              label="Approve (full)"
              variant="success"
              onPress={() => run(() => dispatch({ type: 'APPROVE_CLAIM', claimId }))}
            />
            <Button label="Reject" variant="danger" onPress={() => run(() => dispatch({ type: 'REJECT_CLAIM', claimId }))} />
          </>
        )}
        {(claim.status === 'approved' || claim.status === 'partially_paid') && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Record payment</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount (₦)"
              keyboardType="decimal-pad"
              value={paymentInput}
              onChangeText={setPaymentInput}
              accessibilityLabel="Payment amount"
            />
            <Button label="Record payment" variant="success" onPress={submitPayment} />
          </View>
        )}
      </View>

      {claim.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.paymentLabel}>Payments</Text>
          {claim.payments.map((payment) => (
            <Row
              key={payment.id}
              label={new Date(payment.paidAt).toLocaleDateString()}
              value={formatMoney(payment.amount)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  back: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: 22, fontWeight: '700', color: colors.text },
  facility: { fontSize: 14, color: colors.muted },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: colors.muted, fontSize: 14 },
  detailValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  actions: { gap: 10 },
  button: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: colors.primaryText, fontWeight: '700', fontSize: 15 },
  paymentBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  paymentLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  missing: { fontSize: 16, color: colors.muted, marginBottom: 12 },
});
