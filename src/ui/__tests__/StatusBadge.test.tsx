import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the human-readable label for a status', async () => {
    await render(<StatusBadge status="under_review" />);
    expect(screen.getByText('Under review')).toBeTruthy();
  });

  it('renders the paid label', async () => {
    await render(<StatusBadge status="paid" />);
    expect(screen.getByText('Paid')).toBeTruthy();
  });
});
