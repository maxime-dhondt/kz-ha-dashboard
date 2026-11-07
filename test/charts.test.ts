import { describe, expect, it } from 'vitest';
import { barRatios, smoothPath, sparkline } from '../src/shared/charts';

describe('charts', () => {
  it('smoothPath starts with M and uses cubic segments', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ]);
    expect(d.startsWith('M0,0')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });

  it('sparkline needs two valid values', () => {
    expect(sparkline([1, null], 100, 50)).toEqual({ line: '', area: '' });
    const s = sparkline([1, 2, null, 3], 100, 50);
    expect(s.line).not.toBe('');
    expect(s.area.endsWith('Z')).toBe(true);
  });

  it('sparkline keeps y inside the box (higher value = higher on screen)', () => {
    const s = sparkline([0, 10], 100, 50, 4);
    expect(s.line.startsWith('M4,46')).toBe(true); // min at the bottom
  });

  it('barRatios normalizes against the max', () => {
    expect(barRatios([1, 2, null, 4])).toEqual([0.25, 0.5, 0, 1]);
    expect(barRatios([null, null])).toEqual([0, 0]);
  });
});
