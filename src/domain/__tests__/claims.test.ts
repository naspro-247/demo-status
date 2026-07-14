import {
  approveClaim,
  canTransition,
  createClaim,
  isTerminalStatus,
  outstandingBalance,
  recordPayment,
  rejectClaim,
  reviewClaim,
  totalPaid,
  transitionClaim,
} from '../claims';
import { toMinorUnits } from '../money';
import type { Claim } from '../types';

function newClaim(claimed = toMinorUnits(1000)): Claim {
  return createClaim({
    facilityId: 'fac_1',
    reference: 'REF-1',
    claimedAmount: claimed,
    submittedAt: '2024-01-01T00:00:00.000Z',
  });
}

describe('createClaim', () => {
  it('creates a submitted claim with sensible defaults', () => {
    const claim = newClaim();
    expect(claim.status).toBe('submitted');
    expect(claim.approvedAmount).toBe(0);
    expect(claim.payments).toEqual([]);
    expect(claim.reference).toBe('REF-1');
  });

  it('trims the reference', () => {
    const claim = createClaim({
      facilityId: 'fac_1',
      reference: '  REF-9  ',
      claimedAmount: 100,
    });
    expect(claim.reference).toBe('REF-9');
  });

  it('defaults submittedAt to now when omitted', () => {
    const before = Date.now();
    const claim = createClaim({ facilityId: 'fac_1', reference: 'R', claimedAmount: 100 });
    expect(new Date(claim.submittedAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  it('rejects a blank reference', () => {
    expect(() =>
      createClaim({ facilityId: 'fac_1', reference: '   ', claimedAmount: 100 }),
    ).toThrow(/reference is required/);
  });

  it('rejects a missing facility', () => {
    expect(() =>
      createClaim({ facilityId: '', reference: 'R', claimedAmount: 100 }),
    ).toThrow(/facility/);
  });

  it.each([0, -5, 10.5, NaN])('rejects invalid claimed amount %p', (amount) => {
    expect(() =>
      createClaim({ facilityId: 'fac_1', reference: 'R', claimedAmount: amount }),
    ).toThrow(/positive integer/);
  });
});

describe('status helpers', () => {
  it('identifies terminal statuses', () => {
    expect(isTerminalStatus('paid')).toBe(true);
    expect(isTerminalStatus('rejected')).toBe(true);
    expect(isTerminalStatus('submitted')).toBe(false);
    expect(isTerminalStatus('approved')).toBe(false);
  });

  it('reports allowed transitions', () => {
    expect(canTransition('submitted', 'under_review')).toBe(true);
    expect(canTransition('under_review', 'approved')).toBe(true);
    expect(canTransition('approved', 'paid')).toBe(true);
    expect(canTransition('submitted', 'paid')).toBe(false);
    expect(canTransition('rejected', 'approved')).toBe(false);
  });
});

describe('transitionClaim', () => {
  it('returns the same claim when transitioning to the current status', () => {
    const claim = newClaim();
    expect(transitionClaim(claim, 'submitted')).toBe(claim);
  });

  it('does not mutate the input claim', () => {
    const claim = newClaim();
    const next = transitionClaim(claim, 'under_review');
    expect(claim.status).toBe('submitted');
    expect(next.status).toBe('under_review');
  });

  it('throws on a disallowed transition', () => {
    const claim = newClaim();
    expect(() => transitionClaim(claim, 'paid')).toThrow(/Cannot transition/);
  });
});

describe('reviewClaim', () => {
  it('moves a submitted claim under review', () => {
    expect(reviewClaim(newClaim()).status).toBe('under_review');
  });

  it('throws when the claim is not submitted', () => {
    const approved = approveClaim(reviewClaim(newClaim()));
    expect(() => reviewClaim(approved)).toThrow(/Cannot transition/);
  });
});

describe('approveClaim', () => {
  it('approves for the full claimed amount by default', () => {
    const claim = approveClaim(reviewClaim(newClaim(toMinorUnits(1000))));
    expect(claim.status).toBe('approved');
    expect(claim.approvedAmount).toBe(toMinorUnits(1000));
  });

  it('approves for a reduced amount', () => {
    const claim = approveClaim(reviewClaim(newClaim(toMinorUnits(1000))), toMinorUnits(800));
    expect(claim.approvedAmount).toBe(toMinorUnits(800));
  });

  it('rejects an approved amount greater than claimed', () => {
    const reviewed = reviewClaim(newClaim(toMinorUnits(1000)));
    expect(() => approveClaim(reviewed, toMinorUnits(1200))).toThrow(/cannot exceed/);
  });

  it.each([0, -1, 10.5])('rejects invalid approved amount %p', (amount) => {
    const reviewed = reviewClaim(newClaim());
    expect(() => approveClaim(reviewed, amount)).toThrow(/positive integer/);
  });

  it('throws when the claim is not under review', () => {
    expect(() => approveClaim(newClaim())).toThrow(/Cannot transition/);
  });
});

describe('rejectClaim', () => {
  it('rejects a submitted claim', () => {
    expect(rejectClaim(newClaim()).status).toBe('rejected');
  });

  it('rejects a claim under review and records a note', () => {
    const rejected = rejectClaim(reviewClaim(newClaim()), 'Missing documentation');
    expect(rejected.status).toBe('rejected');
    expect(rejected.note).toBe('Missing documentation');
  });

  it('throws when rejecting an approved claim', () => {
    const approved = approveClaim(reviewClaim(newClaim()));
    expect(() => rejectClaim(approved)).toThrow(/Cannot transition/);
  });
});

describe('payments', () => {
  function approvedClaim(claimed = toMinorUnits(1000), approved?: number): Claim {
    return approveClaim(reviewClaim(newClaim(claimed)), approved);
  }

  it('records a partial payment and moves to partially_paid', () => {
    const claim = recordPayment(approvedClaim(), toMinorUnits(400));
    expect(claim.status).toBe('partially_paid');
    expect(totalPaid(claim)).toBe(toMinorUnits(400));
    expect(outstandingBalance(claim)).toBe(toMinorUnits(600));
  });

  it('records a full payment and moves to paid', () => {
    const claim = recordPayment(approvedClaim(), toMinorUnits(1000));
    expect(claim.status).toBe('paid');
    expect(outstandingBalance(claim)).toBe(0);
  });

  it('accumulates multiple payments to fully paid', () => {
    let claim = approvedClaim();
    claim = recordPayment(claim, toMinorUnits(300));
    claim = recordPayment(claim, toMinorUnits(700));
    expect(claim.status).toBe('paid');
    expect(claim.payments).toHaveLength(2);
    expect(totalPaid(claim)).toBe(toMinorUnits(1000));
  });

  it('respects a reduced approved amount', () => {
    const claim = recordPayment(approvedClaim(toMinorUnits(1000), toMinorUnits(800)), toMinorUnits(800));
    expect(claim.status).toBe('paid');
  });

  it('throws when the claim is not approved', () => {
    expect(() => recordPayment(newClaim(), toMinorUnits(100))).toThrow(/approved claim/);
  });

  it('throws when the payment exceeds the outstanding balance', () => {
    expect(() => recordPayment(approvedClaim(), toMinorUnits(1500))).toThrow(/exceeds/);
  });

  it.each([0, -100, 10.5])('throws on invalid payment amount %p', (amount) => {
    expect(() => recordPayment(approvedClaim(), amount)).toThrow(/positive integer/);
  });

  it('does not mutate the original claim', () => {
    const claim = approvedClaim();
    recordPayment(claim, toMinorUnits(500));
    expect(claim.payments).toHaveLength(0);
    expect(claim.status).toBe('approved');
  });
});

describe('balance helpers', () => {
  it('reports zero outstanding for an unapproved claim', () => {
    expect(outstandingBalance(newClaim())).toBe(0);
  });

  it('reports zero total paid for a new claim', () => {
    expect(totalPaid(newClaim())).toBe(0);
  });
});
