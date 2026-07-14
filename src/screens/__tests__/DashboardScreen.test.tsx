import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { approveClaim, createClaim, recordPayment, reviewClaim } from '../../domain/claims';
import { toMinorUnits } from '../../domain/money';
import type { AppState } from '../../state/reducer';
import { StoreProvider } from '../../state/store';
import { DashboardScreen } from '../DashboardScreen';

function preloaded(): AppState {
  const claim = recordPayment(
    approveClaim(
      reviewClaim(
        createClaim({ facilityId: 'fac_1', reference: 'R1', claimedAmount: toMinorUnits(1000) }),
      ),
    ),
    toMinorUnits(250),
  );
  return {
    facilities: [
      { id: 'fac_1', name: 'Alpha Hospital' },
      { id: 'fac_2', name: 'Beta Clinic' },
    ],
    claims: [claim],
  };
}

describe('DashboardScreen', () => {
  it('shows headline totals and the payment rate', async () => {
    await render(
      <StoreProvider preloadedState={preloaded()}>
        <DashboardScreen />
      </StoreProvider>,
    );
    expect(screen.getByText('Total claimed')).toBeTruthy();
    expect(screen.getByText('Outstanding')).toBeTruthy();
    // 250 paid of 1000 approved = 25%.
    expect(screen.getByText('25% of approved value paid')).toBeTruthy();
  });

  it('lists every facility, including those with no claims', async () => {
    await render(
      <StoreProvider preloadedState={preloaded()}>
        <DashboardScreen />
      </StoreProvider>,
    );
    expect(screen.getByText('Alpha Hospital')).toBeTruthy();
    expect(screen.getByText('Beta Clinic')).toBeTruthy();
  });
});
