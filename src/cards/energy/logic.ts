export interface Power {
  value: number;
  unit: string;
}

/** Normalizes a power reading to kW (W and MW are converted; other units are kept). */
export function toKw(value: number, unit?: string): Power {
  switch (unit) {
    case 'W':
      return { value: value / 1000, unit: 'kW' };
    case 'MW':
      return { value: value * 1000, unit: 'kW' };
    case 'kW':
      return { value, unit: 'kW' };
    default:
      return { value, unit: unit ?? '' };
  }
}

/** Number of fraction digits used to display a power value. */
export function powerDigits(value: number): number {
  return Math.abs(value) >= 10 ? 0 : 1;
}
