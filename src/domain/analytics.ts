import { outstandingBalance, totalPaid } from './claims';
import type { Claim, Facility } from './types';

export interface ClaimsSummary {
  claimCount: number;
  /** Sum of all claimed amounts, in minor units. */
  totalClaimed: number;
  /** Sum of all approved amounts, in minor units. */
  totalApproved: number;
  /** Sum of all payments made, in minor units. */
  totalPaid: number;
  /** Sum of outstanding balances on approved claims, in minor units. */
  totalOutstanding: number;
}

export interface FacilitySummary extends ClaimsSummary {
  facilityId: string;
  facilityName: string;
}

/** Aggregate totals across a list of claims. */
export function summarizeClaims(claims: Claim[]): ClaimsSummary {
  return claims.reduce<ClaimsSummary>(
    (acc, claim) => {
      acc.claimCount += 1;
      acc.totalClaimed += claim.claimedAmount;
      acc.totalApproved += claim.approvedAmount;
      acc.totalPaid += totalPaid(claim);
      acc.totalOutstanding += outstandingBalance(claim);
      return acc;
    },
    {
      claimCount: 0,
      totalClaimed: 0,
      totalApproved: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    },
  );
}

/**
 * Fraction of approved money that has actually been paid, in the range
 * [0, 1]. Returns 0 when nothing has been approved yet.
 */
export function paymentRate(claims: Claim[]): number {
  const summary = summarizeClaims(claims);
  if (summary.totalApproved === 0) {
    return 0;
  }
  return summary.totalPaid / summary.totalApproved;
}

/**
 * Build a per-facility summary, sorted by outstanding balance descending
 * so facilities owed the most appear first. Facilities with no claims are
 * included with zeroed totals.
 */
export function summarizeByFacility(
  facilities: Facility[],
  claims: Claim[],
): FacilitySummary[] {
  const byFacility = new Map<string, Claim[]>();
  for (const facility of facilities) {
    byFacility.set(facility.id, []);
  }
  for (const claim of claims) {
    const list = byFacility.get(claim.facilityId);
    if (list) {
      list.push(claim);
    }
  }

  return facilities
    .map((facility) => {
      const facilityClaims = byFacility.get(facility.id) ?? [];
      return {
        facilityId: facility.id,
        facilityName: facility.name,
        ...summarizeClaims(facilityClaims),
      };
    })
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}
