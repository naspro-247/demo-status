import {
  formatMoney,
  MINOR_UNITS_PER_MAJOR,
  parseMoney,
  toMajorUnits,
  toMinorUnits,
} from '../money';

describe('money', () => {
  describe('toMinorUnits', () => {
    it('converts major units to integer minor units', () => {
      expect(toMinorUnits(1)).toBe(100);
      expect(toMinorUnits(12.34)).toBe(1234);
    });

    it('rounds to the nearest minor unit', () => {
      expect(toMinorUnits(1.006)).toBe(101);
      expect(toMinorUnits(1.004)).toBe(100);
    });

    it('handles zero', () => {
      expect(toMinorUnits(0)).toBe(0);
    });

    it('throws on non-finite input', () => {
      expect(() => toMinorUnits(NaN)).toThrow();
      expect(() => toMinorUnits(Infinity)).toThrow();
    });
  });

  describe('toMajorUnits', () => {
    it('is the inverse of toMinorUnits for whole amounts', () => {
      expect(toMajorUnits(1234)).toBeCloseTo(12.34);
      expect(toMajorUnits(toMinorUnits(99.99))).toBeCloseTo(99.99);
    });

    it('uses the documented conversion factor', () => {
      expect(toMajorUnits(MINOR_UNITS_PER_MAJOR)).toBe(1);
    });
  });

  describe('formatMoney', () => {
    it('formats with the naira symbol and two decimals', () => {
      expect(formatMoney(150000)).toBe('₦1,500.00');
    });

    it('groups thousands', () => {
      expect(formatMoney(123456789)).toBe('₦1,234,567.89');
    });

    it('supports a custom symbol', () => {
      expect(formatMoney(100, '$')).toBe('$1.00');
    });

    it('renders negative amounts with a leading minus', () => {
      expect(formatMoney(-2500)).toBe('-₦25.00');
    });

    it('formats zero', () => {
      expect(formatMoney(0)).toBe('₦0.00');
    });
  });

  describe('parseMoney', () => {
    it('parses a plain decimal string', () => {
      expect(parseMoney('1250.50')).toBe(125050);
    });

    it('ignores currency symbols and grouping commas', () => {
      expect(parseMoney('₦1,250.50')).toBe(125050);
    });

    it('parses integers', () => {
      expect(parseMoney('500')).toBe(50000);
    });

    it('returns null for empty or non-numeric input', () => {
      expect(parseMoney('')).toBeNull();
      expect(parseMoney('   ')).toBeNull();
      expect(parseMoney('abc')).toBeNull();
      expect(parseMoney('.')).toBeNull();
    });
  });
});
