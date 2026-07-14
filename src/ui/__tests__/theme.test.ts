import type { ClaimStatus } from '../../domain/types';
import { statusMeta } from '../theme';

const ALL_STATUSES: ClaimStatus[] = [
  'submitted',
  'under_review',
  'approved',
  'partially_paid',
  'paid',
  'rejected',
];

describe('statusMeta', () => {
  it('returns a label and colour for every status', () => {
    for (const status of ALL_STATUSES) {
      const meta = statusMeta(status);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('uses distinct labels per status', () => {
    const labels = ALL_STATUSES.map((status) => statusMeta(status).label);
    expect(new Set(labels).size).toBe(ALL_STATUSES.length);
  });
});
