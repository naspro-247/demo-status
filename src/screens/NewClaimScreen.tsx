import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { parseMoney } from '../domain/money';
import { useStore } from '../state/store';
import { colors } from '../ui/theme';

export function NewClaimScreen({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useStore();
  const [facilityId, setFacilityId] = useState(state.facilities[0]?.id ?? '');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');

  const submit = () => {
    const claimedAmount = parseMoney(amount);
    if (!facilityId) {
      Alert.alert('Missing facility', 'Select a facility for this claim.');
      return;
    }
    if (reference.trim() === '') {
      Alert.alert('Missing reference', 'Enter a claim reference.');
      return;
    }
    if (claimedAmount === null || claimedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive claimed amount.');
      return;
    }
    try {
      dispatch({ type: 'ADD_CLAIM', input: { facilityId, reference, claimedAmount } });
      setReference('');
      setAmount('');
      onDone();
    } catch (error) {
      Alert.alert('Could not add claim', error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>New claim</Text>

      <Text style={styles.label}>Facility</Text>
      <View style={styles.chips}>
        {state.facilities.map((facility) => {
          const selected = facility.id === facilityId;
          return (
            <Pressable
              key={facility.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setFacilityId(facility.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${facility.name}`}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {facility.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Reference</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. LAG-1003"
        value={reference}
        onChangeText={setReference}
        accessibilityLabel="Claim reference"
      />

      <Text style={styles.label}>Claimed amount (₦)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        accessibilityLabel="Claimed amount"
      />

      <Pressable style={styles.submit} onPress={submit} accessibilityRole="button" accessibilityLabel="Save claim">
        <Text style={styles.submitText}>Save claim</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextSelected: { color: colors.primaryText, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
});
