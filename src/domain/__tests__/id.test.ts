import { createId, resetIdCounter } from '../id';

describe('id', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('applies the given prefix', () => {
    expect(createId('claim')).toMatch(/^claim_/);
    expect(createId('pay')).toMatch(/^pay_/);
  });

  it('defaults the prefix to "id"', () => {
    expect(createId()).toMatch(/^id_/);
  });

  it('generates unique ids across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });
});
