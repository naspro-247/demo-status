import {
  approveClaim,
  createClaim,
  recordPayment,
  rejectClaim,
  reviewClaim,
  type CreateClaimInput,
} from '../domain/claims';
import { createId } from '../domain/id';
import type { Claim, Facility } from '../domain/types';

export interface AppState {
  facilities: Facility[];
  claims: Claim[];
}

export type AppAction =
  | { type: 'ADD_FACILITY'; name: string; location?: string }
  | { type: 'ADD_CLAIM'; input: CreateClaimInput }
  | { type: 'REVIEW_CLAIM'; claimId: string }
  | { type: 'APPROVE_CLAIM'; claimId: string; approvedAmount?: number }
  | { type: 'REJECT_CLAIM'; claimId: string; note?: string }
  | { type: 'RECORD_PAYMENT'; claimId: string; amount: number; note?: string };

/** Apply a transformation to a single claim, identified by id. */
function mapClaim(state: AppState, claimId: string, fn: (claim: Claim) => Claim): AppState {
  let found = false;
  const claims = state.claims.map((claim) => {
    if (claim.id !== claimId) {
      return claim;
    }
    found = true;
    return fn(claim);
  });
  if (!found) {
    throw new Error(`Unknown claim: ${claimId}`);
  }
  return { ...state, claims };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FACILITY': {
      const name = action.name.trim();
      if (name === '') {
        throw new Error('Facility name is required');
      }
      const facility: Facility = { id: createId('fac'), name, location: action.location?.trim() };
      return { ...state, facilities: [...state.facilities, facility] };
    }
    case 'ADD_CLAIM': {
      const claim = createClaim(action.input);
      return { ...state, claims: [claim, ...state.claims] };
    }
    case 'REVIEW_CLAIM':
      return mapClaim(state, action.claimId, reviewClaim);
    case 'APPROVE_CLAIM':
      return mapClaim(state, action.claimId, (claim) =>
        approveClaim(claim, action.approvedAmount),
      );
    case 'REJECT_CLAIM':
      return mapClaim(state, action.claimId, (claim) => rejectClaim(claim, action.note));
    case 'RECORD_PAYMENT':
      return mapClaim(state, action.claimId, (claim) =>
        recordPayment(claim, action.amount, { note: action.note }),
      );
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function findClaim(state: AppState, claimId: string): Claim | undefined {
  return state.claims.find((claim) => claim.id === claimId);
}

export function findFacility(state: AppState, facilityId: string): Facility | undefined {
  return state.facilities.find((facility) => facility.id === facilityId);
}
