import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ClaimDetailScreen } from './src/screens/ClaimDetailScreen';
import { ClaimsScreen } from './src/screens/ClaimsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { NewClaimScreen } from './src/screens/NewClaimScreen';
import { StoreProvider } from './src/state/store';
import { colors } from './src/ui/theme';

type Tab = 'dashboard' | 'claims' | 'new';

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Shell() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [openClaimId, setOpenClaimId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>HMO Claims Tracker</Text>
      </View>

      <View style={styles.body}>
        {openClaimId ? (
          <ClaimDetailScreen claimId={openClaimId} onBack={() => setOpenClaimId(null)} />
        ) : tab === 'dashboard' ? (
          <DashboardScreen />
        ) : tab === 'claims' ? (
          <ClaimsScreen onOpenClaim={setOpenClaimId} />
        ) : (
          <NewClaimScreen
            onDone={() => {
              setTab('claims');
            }}
          />
        )}
      </View>

      {!openClaimId && (
        <View style={styles.tabBar}>
          <TabButton label="Dashboard" active={tab === 'dashboard'} onPress={() => setTab('dashboard')} />
          <TabButton label="Claims" active={tab === 'claims'} onPress={() => setTab('claims')} />
          <TabButton label="New claim" active={tab === 'new'} onPress={() => setTab('new')} />
        </View>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primary,
  },
  title: { color: colors.primaryText, fontSize: 20, fontWeight: '700' },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
});
