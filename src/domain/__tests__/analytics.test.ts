import { approveClaim, createClaim, recordPayment, reviewClaim } from '../claims';
import { toMinorUnits } from '../money';
import {
  paymentRate,
  summarizeByFacility,
  summarizeClaims,
} from '../analytics';
import type { Claim, Facility } from '../types';

const facilities: Facility[] = [
  { id: 'fac_a', name: 'Facility A' },
  { id: 'fac_b', name: 'Facility B' },
  { id: 'fac_c', name: 'Facility C' },
];

function claimFor(facilityId: string, claimed: number): Claim {
  return createClaim({ facilityId, reference: `${facilityId}-ref`, claimedAmount: claimed });
}

function approvedClaim(facilityId: string, claimed: number, approved: number): Claim {
  return approveClaim(reviewClaim(claimFor(facilityId, claimed)), approved);
}

function paidClaim(facilityId: string, claimed: number, approved: number, paid: number): Claim {
  const claim = approvedClaim(facilityId, claimed, approved);
  return paid > 0 ? recordPayment(claim, paid) : claim;
}

describe('summarizeClaims', () => {
  it('returns zeroed totals for an empty list', () => {
    expect(summarizeClaims([])).toEqual({
      claimCount: 0,
      totalClaimed: 0,
      totalApproved: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    });
  });

  it('aggregates claimed, approved, paid and outstanding', () => {
    const claims = [
      claimFor('fac_a', toMinorUnits(1000)), // submitted, nothing approved
      paidClaim('fac_a', toMinorUnits(2000), toMinorUnits(2000), toMinorUnits(500)),
    ];
    const summary = summarizeClaims(claims);
    expect(summary.claimCount).toBe(2);
    expect(summary.totalClaimed).toBe(toMinorUnits(3000));
    expect(summary.totalApproved).toBe(toMinorUnits(2000));
    expect(summary.totalPaid).toBe(toMinorUnits(500));
    expect(summary.totalOutstanding).toBe(toMinorUnits(1500));
  });
});

describe('paymentRate', () => {
  it('is 0 when nothing has been approved', () => {
    expect(paymentRate([claimFor('fac_a', toMinorUnits(1000))])).toBe(0);
    expect(paymentRate([])).toBe(0);
  });

  it('is the ratio of paid to approved', () => {
    const claims = [paidClaim('fac_a', toMinorUnits(1000), toMinorUnits(1000), toMinorUnits(250))];
    expect(paymentRate(claims)).toBeCloseTo(0.25);
  });

  it('is 1 when everything approved is fully paid', () => {
    const claims = [paidClaim('fac_a', toMinorUnits(1000), toMinorUnits(1000), toMinorUnits(1000))];
    expect(paymentRate(claims)).toBe(1);
  });
});

describe('summarizeByFacility', () => {
  it('includes facilities with no claims, zeroed', () => {
    const summaries = summarizeByFacility(facilities, []);
    expect(summaries).toHaveLength(3);
    for (const s of summaries) {
      expect(s.claimCount).toBe(0);
      expect(s.totalOutstanding).toBe(0);
    }
  });

  it('attributes claims to the right facility', () => {
    const claims = [
      claimFor('fac_a', toMinorUnits(1000)),
      claimFor('fac_b', toMinorUnits(2000)),
    ];
    const byId = Object.fromEntries(
      summarizeByFacility(facilities, claims).map((s) => [s.facilityId, s]),
    );
    expect(byId.fac_a.totalClaimed).toBe(toMinorUnits(1000));
    expect(byId.fac_b.totalClaimed).toBe(toMinorUnits(2000));
    expect(byId.fac_c.totalClaimed).toBe(0);
  });

  it('sorts by outstanding balance descending', () => {
    const claims = [
      paidClaim('fac_a', toMinorUnits(1000), toMinorUnits(1000), toMinorUnits(900)), // 100 outstanding
      paidClaim('fac_b', toMinorUnits(5000), toMinorUnits(5000), toMinorUnits(0)), // 5000 outstanding
    ];
    const summaries = summarizeByFacility(facilities, claims);
    expect(summaries.map((s) => s.facilityId)).toEqual(['fac_b', 'fac_a', 'fac_c']);
  });

  it('ignores claims for unknown facilities', () => {
    const claims = [claimFor('fac_unknown', toMinorUnits(1000))];
    const summaries = summarizeByFacility(facilities, claims);
    const total = summaries.reduce((sum, s) => sum + s.totalClaimed, 0);
    expect(total).toBe(0);
  });
});
