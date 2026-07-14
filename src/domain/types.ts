/**
 * Core domain types for the HMO Claims Tracker.
 *
 * Monetary values are stored as integer minor units (kobo) to avoid
 * floating-point rounding errors. Use the helpers in `money.ts` to
 * convert to/from the major unit (Naira) for display and input.
 */

export interface Facility {
  id: string;
  name: string;
  /** Optional free-form location / address. */
  location?: string;
}

export type ClaimStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'partially_paid';

export interface Payment {
  id: string;
  /** Amount paid, in minor units (kobo). Always positive. */
  amount: number;
  /** ISO-8601 timestamp of when the payment was recorded. */
  paidAt: string;
  note?: string;
}

export interface Claim {
  id: string;
  facilityId: string;
  /** Human-readable reference, e.g. the facility's own claim number. */
  reference: string;
  /** Amount the facility billed, in minor units (kobo). */
  claimedAmount: number;
  /**
   * Amount the HMO has approved to pay, in minor units (kobo).
   * Only meaningful once the claim has been reviewed. Defaults to the
   * claimed amount when a claim is approved without adjustment.
   */
  approvedAmount: number;
  status: ClaimStatus;
  /** ISO-8601 timestamp of when the claim was submitted. */
  submittedAt: string;
  payments: Payment[];
  note?: string;
}
