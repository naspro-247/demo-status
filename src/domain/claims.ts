import { createId } from './id';
import type { Claim, ClaimStatus, Payment } from './types';

/** Terminal statuses can no longer transition to any other status. */
const TERMINAL_STATUSES: ReadonlySet<ClaimStatus> = new Set(['rejected', 'paid']);

/** Allowed status transitions for a claim. */
const ALLOWED_TRANSITIONS: Record<ClaimStatus, readonly ClaimStatus[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['partially_paid', 'paid'],
  partially_paid: ['paid'],
  rejected: [],
  paid: [],
};

export interface CreateClaimInput {
  facilityId: string;
  reference: string;
  /** Claimed amount in minor units (kobo). Must be a positive integer. */
  claimedAmount: number;
  submittedAt?: string;
  note?: string;
}

export function isTerminalStatus(status: ClaimStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Create a new claim from validated input.
 *
 * @throws if the reference is blank or the claimed amount is not a
 * positive integer number of minor units.
 */
export function createClaim(input: CreateClaimInput): Claim {
  const reference = input.reference.trim();
  if (reference === '') {
    throw new Error('Claim reference is required');
  }
  if (input.facilityId.trim() === '') {
    throw new Error('Claim must belong to a facility');
  }
  if (!Number.isInteger(input.claimedAmount) || input.claimedAmount <= 0) {
    throw new Error('Claimed amount must be a positive integer (minor units)');
  }
  return {
    id: createId('claim'),
    facilityId: input.facilityId,
    reference,
    claimedAmount: input.claimedAmount,
    approvedAmount: 0,
    status: 'submitted',
    submittedAt: input.submittedAt ?? new Date().toISOString(),
    payments: [],
    note: input.note,
  };
}

/**
 * Return a copy of the claim with its status changed.
 *
 * @throws if the transition is not allowed from the claim's current status.
 */
export function transitionClaim(claim: Claim, to: ClaimStatus): Claim {
  if (claim.status === to) {
    return claim;
  }
  if (!canTransition(claim.status, to)) {
    throw new Error(`Cannot transition claim from "${claim.status}" to "${to}"`);
  }
  return { ...claim, status: to };
}

/**
 * Move a claim into review. Only valid from the "submitted" state.
 */
export function reviewClaim(claim: Claim): Claim {
  return transitionClaim(claim, 'under_review');
}

/**
 * Approve a claim for payment.
 *
 * @param approvedAmount amount approved in minor units. Defaults to the
 * full claimed amount. Must be a positive integer no greater than the
 * claimed amount.
 * @throws if the claim is not under review or the amount is invalid.
 */
export function approveClaim(claim: Claim, approvedAmount?: number): Claim {
  const amount = approvedAmount ?? claim.claimedAmount;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Approved amount must be a positive integer (minor units)');
  }
  if (amount > claim.claimedAmount) {
    throw new Error('Approved amount cannot exceed the claimed amount');
  }
  const transitioned = transitionClaim(claim, 'approved');
  return { ...transitioned, approvedAmount: amount };
}

/** Reject a claim. Valid from "submitted" or "under_review". */
export function rejectClaim(claim: Claim, note?: string): Claim {
  const transitioned = transitionClaim(claim, 'rejected');
  return { ...transitioned, note: note ?? transitioned.note };
}

/** Total amount paid against a claim, in minor units. */
export function totalPaid(claim: Claim): number {
  return claim.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Amount still owed on an approved claim, in minor units. Never negative.
 * For claims that have not been approved this is based on the approved
 * amount (which is 0 until approval), so it returns 0.
 */
export function outstandingBalance(claim: Claim): number {
  return Math.max(0, claim.approvedAmount - totalPaid(claim));
}

/**
 * Record a payment against an approved claim.
 *
 * Applying a payment automatically advances the claim status to
 * "partially_paid" or "paid" depending on the outstanding balance.
 *
 * @throws if the claim has not been approved, the amount is not a
 * positive integer, or the payment would exceed the approved amount.
 */
export function recordPayment(
  claim: Claim,
  amount: number,
  options: { paidAt?: string; note?: string } = {},
): Claim {
  if (claim.status !== 'approved' && claim.status !== 'partially_paid') {
    throw new Error('Payments can only be recorded against an approved claim');
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Payment amount must be a positive integer (minor units)');
  }
  if (amount > outstandingBalance(claim)) {
    throw new Error('Payment exceeds the outstanding balance');
  }

  const payment: Payment = {
    id: createId('pay'),
    amount,
    paidAt: options.paidAt ?? new Date().toISOString(),
    note: options.note,
  };
  const payments = [...claim.payments, payment];
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const status: ClaimStatus = paid >= claim.approvedAmount ? 'paid' : 'partially_paid';

  return { ...claim, payments, status };
}
