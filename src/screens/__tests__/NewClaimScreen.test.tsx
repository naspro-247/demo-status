import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import type { AppState } from '../../state/reducer';
import { StoreProvider } from '../../state/store';
import { NewClaimScreen } from '../NewClaimScreen';

function baseState(): AppState {
  return { facilities: [{ id: 'fac_1', name: 'Alpha Hospital' }], claims: [] };
}

describe('NewClaimScreen', () => {
  it('renders the facility chips and form fields', async () => {
    await render(
      <StoreProvider preloadedState={baseState()}>
        <NewClaimScreen onDone={() => {}} />
      </StoreProvider>,
    );
    expect(screen.getByText('Alpha Hospital')).toBeTruthy();
    expect(screen.getByLabelText('Claim reference')).toBeTruthy();
    expect(screen.getByLabelText('Claimed amount')).toBeTruthy();
  });

  it('calls onDone after a valid submission', async () => {
    const onDone = jest.fn();
    await render(
      <StoreProvider preloadedState={baseState()}>
        <NewClaimScreen onDone={onDone} />
      </StoreProvider>,
    );
    await fireEvent.changeText(screen.getByLabelText('Claim reference'), 'REF-77');
    await fireEvent.changeText(screen.getByLabelText('Claimed amount'), '1500');
    await fireEvent.press(screen.getByLabelText('Save claim'));
    expect(onDone).toHaveBeenCalled();
  });

  it('does not submit when required fields are missing', async () => {
    const onDone = jest.fn();
    await render(
      <StoreProvider preloadedState={baseState()}>
        <NewClaimScreen onDone={onDone} />
      </StoreProvider>,
    );
    await fireEvent.press(screen.getByLabelText('Save claim'));
    expect(onDone).not.toHaveBeenCalled();
  });
});
