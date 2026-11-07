import { describe, expect, it } from 'vitest';
import { bucketize } from '../src/shared/history';

const H = 3_600_000;

describe('bucketize', () => {
  it('holds a step value until the next change (time-weighted)', () => {
    const points = [
      { t: 0, v: 10 },
      { t: 1.5 * H, v: 20 },
    ];
    const out = bucketize(points, { start: 0, end: 4 * H, buckets: 4 });
    expect(out[0]).toBe(10);
    expect(out[1]).toBeCloseTo(15); // half at 10, half at 20
    expect(out[2]).toBe(20);
    expect(out[3]).toBe(20);
  });

  it('returns null for buckets without any data', () => {
    const out = bucketize([{ t: 2 * H, v: 5 }], { start: 0, end: 4 * H, buckets: 4 });
    expect(out).toEqual([null, null, 5, 5]);
  });

  it('ignores time after `until`', () => {
    const out = bucketize([{ t: 0, v: 7 }], { start: 0, end: 4 * H, buckets: 4, until: 2 * H });
    expect(out).toEqual([7, 7, null, null]);
  });

  it('copes with unsorted input', () => {
    const out = bucketize(
      [
        { t: 2 * H, v: 2 },
        { t: 0, v: 1 },
      ],
      { start: 0, end: 4 * H, buckets: 2 },
    );
    expect(out).toEqual([1, 2]);
  });
});
