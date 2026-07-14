import { approveClaim, createClaim, recordPayment, reviewClaim } from '../domain/claims';
import { toMinorUnits } from '../domain/money';
import type { Claim, Facility } from '../domain/types';

export const seedFacilities: Facility[] = [
  { id: 'fac_lagoon', name: 'Lagoon Hospital', location: 'Lagos' },
  { id: 'fac_reddington', name: 'Reddington Hospital', location: 'Lagos' },
  { id: 'fac_nisa', name: 'Nisa Premier Hospital', location: 'Abuja' },
];

/**
 * Build a small set of claims in varied states so the UI has something
 * meaningful to display on first launch.
 */
export function buildSeedClaims(): Claim[] {
  const submitted = createClaim({
    facilityId: 'fac_lagoon',
    reference: 'LAG-1001',
    claimedAmount: toMinorUnits(150000),
    submittedAt: '2024-01-05T09:00:00.000Z',
    note: 'Maternity package',
  });

  const underReview = reviewClaim(
    createClaim({
      facilityId: 'fac_reddington',
      reference: 'RED-2043',
      claimedAmount: toMinorUnits(85000),
      submittedAt: '2024-01-08T11:30:00.000Z',
    }),
  );

  const partiallyPaid = recordPayment(
    approveClaim(
      reviewClaim(
        createClaim({
          facilityId: 'fac_nisa',
          reference: 'NIS-3310',
          claimedAmount: toMinorUnits(200000),
          submittedAt: '2023-12-20T14:00:00.000Z',
        }),
      ),
      toMinorUnits(180000),
    ),
    toMinorUnits(100000),
    { paidAt: '2024-01-15T10:00:00.000Z' },
  );

  const fullyPaid = recordPayment(
    approveClaim(
      reviewClaim(
        createClaim({
          facilityId: 'fac_lagoon',
          reference: 'LAG-1002',
          claimedAmount: toMinorUnits(50000),
          submittedAt: '2023-12-01T08:00:00.000Z',
        }),
      ),
    ),
    toMinorUnits(50000),
    { paidAt: '2023-12-10T09:00:00.000Z' },
  );

  return [submitted, underReview, partiallyPaid, fullyPaid];
}
