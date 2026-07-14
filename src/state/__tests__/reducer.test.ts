import { toMinorUnits } from '../../domain/money';
import type { AppState } from '../reducer';
import { appReducer, findClaim, findFacility } from '../reducer';

function baseState(): AppState {
  return {
    facilities: [{ id: 'fac_1', name: 'Facility 1' }],
    claims: [],
  };
}

function addClaim(state: AppState, amount = toMinorUnits(1000)) {
  return appReducer(state, {
    type: 'ADD_CLAIM',
    input: { facilityId: 'fac_1', reference: 'REF-1', claimedAmount: amount },
  });
}

describe('appReducer', () => {
  describe('ADD_FACILITY', () => {
    it('appends a new facility', () => {
      const next = appReducer(baseState(), { type: 'ADD_FACILITY', name: 'New Clinic', location: 'Kano' });
      expect(next.facilities).toHaveLength(2);
      expect(next.facilities[1]).toMatchObject({ name: 'New Clinic', location: 'Kano' });
    });

    it('trims the name and rejects blanks', () => {
      expect(() => appReducer(baseState(), { type: 'ADD_FACILITY', name: '   ' })).toThrow(
        /name is required/,
      );
    });

    it('does not mutate previous state', () => {
      const state = baseState();
      appReducer(state, { type: 'ADD_FACILITY', name: 'X' });
      expect(state.facilities).toHaveLength(1);
    });
  });

  describe('ADD_CLAIM', () => {
    it('prepends the new claim', () => {
      const next = addClaim(baseState());
      expect(next.claims).toHaveLength(1);
      expect(next.claims[0].reference).toBe('REF-1');
      expect(next.claims[0].status).toBe('submitted');
    });
  });

  describe('claim lifecycle actions', () => {
    it('reviews, approves and pays a claim', () => {
      let state = addClaim(baseState());
      const id = state.claims[0].id;
      state = appReducer(state, { type: 'REVIEW_CLAIM', claimId: id });
      expect(findClaim(state, id)?.status).toBe('under_review');

      state = appReducer(state, { type: 'APPROVE_CLAIM', claimId: id, approvedAmount: toMinorUnits(800) });
      expect(findClaim(state, id)?.approvedAmount).toBe(toMinorUnits(800));

      state = appReducer(state, { type: 'RECORD_PAYMENT', claimId: id, amount: toMinorUnits(800) });
      expect(findClaim(state, id)?.status).toBe('paid');
    });

    it('rejects a claim with a note', () => {
      let state = addClaim(baseState());
      const id = state.claims[0].id;
      state = appReducer(state, { type: 'REJECT_CLAIM', claimId: id, note: 'Duplicate' });
      const claim = findClaim(state, id);
      expect(claim?.status).toBe('rejected');
      expect(claim?.note).toBe('Duplicate');
    });

    it('throws for an unknown claim id', () => {
      expect(() => appReducer(baseState(), { type: 'REVIEW_CLAIM', claimId: 'nope' })).toThrow(
        /Unknown claim/,
      );
    });

    it('propagates domain validation errors', () => {
      const state = addClaim(baseState());
      const id = state.claims[0].id;
      // Cannot approve a claim that is still submitted.
      expect(() => appReducer(state, { type: 'APPROVE_CLAIM', claimId: id })).toThrow();
    });
  });
});

describe('selectors', () => {
  it('findClaim / findFacility return matching entities or undefined', () => {
    const state = addClaim(baseState());
    const id = state.claims[0].id;
    expect(findClaim(state, id)?.id).toBe(id);
    expect(findClaim(state, 'missing')).toBeUndefined();
    expect(findFacility(state, 'fac_1')?.name).toBe('Facility 1');
    expect(findFacility(state, 'missing')).toBeUndefined();
  });
});
