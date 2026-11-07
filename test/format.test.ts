import { describe, expect, it } from 'vitest';
import { formatHourLabel, formatNumber, formatTime } from '../src/shared/format';

const date = new Date(2026, 10, 7, 14, 5);

describe('format', () => {
  it('honors the 12h / 24h profile preference', () => {
    const h12 = formatTime({ language: 'en', locale: { language: 'en', time_format: '12' } }, date);
    const h24 = formatTime({ language: 'en', locale: { language: 'en', time_format: '24' } }, date);
    expect(h12).toMatch(/2:05\s?PM/);
    expect(h24).toBe('14:05');
  });

  it('formats compact hour labels without spaces', () => {
    const label = formatHourLabel(
      { language: 'en', locale: { language: 'en', time_format: '12' } },
      date,
    );
    expect(label).toBe('2PM');
  });

  it('formats numbers with the user locale', () => {
    expect(formatNumber({ language: 'fr' }, 21.5, 1)).toBe('21,5');
    expect(formatNumber({ language: 'en' }, 21.5, 1)).toBe('21.5');
  });
});
