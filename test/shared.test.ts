import { describe, expect, it } from 'vitest';
import { resolveColor } from '../src/shared/colors';
import { crossedInteractive } from '../src/shared/interaction';
import { appearanceSection, interactionsSection, listSelector } from '../src/shared/editor';

describe('resolveColor', () => {
  it('maps HA color names to theme variables', () => {
    expect(resolveColor('red')).toBe('var(--red-color)');
    expect(resolveColor('deep-orange')).toBe('var(--deep-orange-color)');
    expect(resolveColor('primary')).toBe('var(--primary-color)');
  });
  it('keeps CSS colors as they are', () => {
    expect(resolveColor('#ff0000')).toBe('#ff0000');
    expect(resolveColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
    expect(resolveColor('var(--x)')).toBe('var(--x)');
  });
  it('ignores empty / state / non-strings', () => {
    expect(resolveColor('')).toBeUndefined();
    expect(resolveColor('state')).toBeUndefined();
    expect(resolveColor(undefined)).toBeUndefined();
    expect(resolveColor(42)).toBeUndefined();
  });
});

describe('crossedInteractive', () => {
  const el = (interactive: boolean) => ({ matches: () => interactive });
  const host = { matches: () => false };

  it('is false when only passive elements are crossed', () => {
    expect(crossedInteractive([el(false), el(false), host, el(true)], host)).toBe(false);
  });
  it('is true when a button sits between the target and the host', () => {
    expect(crossedInteractive([el(false), el(true), el(false), host], host)).toBe(true);
  });
  it('ignores nodes without `matches` (text, shadow roots)', () => {
    expect(crossedInteractive([{}, {}, host], host)).toBe(false);
  });
});

describe('editor helpers', () => {
  it('builds an object selector for lists', () => {
    const sel = listSelector({
      labelField: 'name',
      fields: { name: { label: 'Name', selector: { text: {} }, required: true } },
    }) as { object: Record<string, unknown> };
    expect(sel.object.multiple).toBe(true);
    expect(sel.object.label_field).toBe('name');
    expect(Object.keys(sel.object.fields as object)).toEqual(['name']);
    expect('description_field' in sel.object).toBe(false);
  });

  it('keeps the data flat in the shared sections', () => {
    for (const section of [appearanceSection(), interactionsSection()]) {
      expect(section.type).toBe('expandable');
      expect(section.flatten).toBe(true);
    }
    const names = interactionsSection().schema!.map((s) => s.name);
    expect(names).toEqual(['tap_action', 'hold_action']);
  });
});
