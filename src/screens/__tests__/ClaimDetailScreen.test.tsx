import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { approveClaim, createClaim, reviewClaim } from '../../domain/claims';
import { toMinorUnits } from '../../domain/money';
import type { AppState } from '../../state/reducer';
import { StoreProvider } from '../../state/store';
import { ClaimDetailScreen } from '../ClaimDetailScreen';

function stateWith(status: 'submitted' | 'approved') {
  let claim = createClaim({ facilityId: 'fac_1', reference: 'REF-1', claimedAmount: toMinorUnits(1000) });
  if (status === 'approved') {
    claim = approveClaim(reviewClaim(claim));
  }
  const state: AppState = { facilities: [{ id: 'fac_1', name: 'Alpha Hospital' }], claims: [claim] };
  return { state, claimId: claim.id };
}

describe('ClaimDetailScreen', () => {
  it('shows a friendly message for a missing claim', async () => {
    const { state } = stateWith('submitted');
    await render(
      <StoreProvider preloadedState={state}>
        <ClaimDetailScreen claimId="does-not-exist" onBack={() => {}} />
      </StoreProvider>,
    );
    expect(screen.getByText(/no longer exists/)).toBeTruthy();
  });

  it('offers review and reject actions for a submitted claim', async () => {
    const { state, claimId } = stateWith('submitted');
    await render(
      <StoreProvider preloadedState={state}>
        <ClaimDetailScreen claimId={claimId} onBack={() => {}} />
      </StoreProvider>,
    );
    expect(screen.getByLabelText('Start review')).toBeTruthy();
    expect(screen.getByLabelText('Reject')).toBeTruthy();
  });

  it('records a payment and advances an approved claim to paid', async () => {
    const { state, claimId } = stateWith('approved');
    await render(
      <StoreProvider preloadedState={state}>
        <ClaimDetailScreen claimId={claimId} onBack={() => {}} />
      </StoreProvider>,
    );
    await fireEvent.changeText(screen.getByLabelText('Payment amount'), '1000');
    await fireEvent.press(screen.getByLabelText('Record payment'));
    // The status badge now reads "Paid" (alongside the "Paid" summary row label).
    expect(screen.getAllByText('Paid').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Payments')).toBeTruthy();
  });

  it('calls onBack when the back control is pressed', async () => {
    const { state, claimId } = stateWith('submitted');
    const onBack = jest.fn();
    await render(
      <StoreProvider preloadedState={state}>
        <ClaimDetailScreen claimId={claimId} onBack={onBack} />
      </StoreProvider>,
    );
    await fireEvent.press(screen.getByLabelText('Back to claims'));
    expect(onBack).toHaveBeenCalled();
  });
});
