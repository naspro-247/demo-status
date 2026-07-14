import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { toMinorUnits } from '../../domain/money';
import type { AppState } from '../../state/reducer';
import { appReducer } from '../../state/reducer';
import { StoreProvider } from '../../state/store';
import { ClaimsScreen } from '../ClaimsScreen';

function stateWithOneClaim(): AppState {
  const base: AppState = {
    facilities: [{ id: 'fac_1', name: 'Test Hospital' }],
    claims: [],
  };
  return appReducer(base, {
    type: 'ADD_CLAIM',
    input: { facilityId: 'fac_1', reference: 'REF-99', claimedAmount: toMinorUnits(1000) },
  });
}

describe('ClaimsScreen', () => {
  it('lists claims with their reference and facility', async () => {
    await render(
      <StoreProvider preloadedState={stateWithOneClaim()}>
        <ClaimsScreen onOpenClaim={() => {}} />
      </StoreProvider>,
    );
    expect(screen.getByText('REF-99')).toBeTruthy();
    expect(screen.getByText('Test Hospital')).toBeTruthy();
  });

  it('calls onOpenClaim with the claim id when tapped', async () => {
    const state = stateWithOneClaim();
    const onOpen = jest.fn();
    await render(
      <StoreProvider preloadedState={state}>
        <ClaimsScreen onOpenClaim={onOpen} />
      </StoreProvider>,
    );
    await fireEvent.press(screen.getByText('REF-99'));
    expect(onOpen).toHaveBeenCalledWith(state.claims[0].id);
  });

  it('shows an empty state when there are no claims', async () => {
    await render(
      <StoreProvider preloadedState={{ facilities: [], claims: [] }}>
        <ClaimsScreen onOpenClaim={() => {}} />
      </StoreProvider>,
    );
    expect(screen.getByText(/No claims yet/)).toBeTruthy();
  });
});
