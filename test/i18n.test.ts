import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { languageOf, localize } from '../src/shared/i18n';
import en from '../src/shared/translations/en';
import fr from '../src/shared/translations/fr';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'translations' ? [] : sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

describe('i18n', () => {
  it('fr has exactly the same keys as en', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  it('every static key used in the sources exists in en', () => {
    const used = new Set<string>();
    for (const file of sourceFiles('src')) {
      const text = readFileSync(file, 'utf-8');
      for (const m of text.matchAll(/\bt\(\s*'([a-z_]+\.[a-z_]+)'/g)) used.add(m[1]!);
      for (const m of text.matchAll(/localize\([^,]+,\s*'([a-z_]+\.[a-z_]+)'/g)) used.add(m[1]!);
    }
    const missing = [...used].filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });

  it('keeps the same {placeholders} in both languages', () => {
    const tokens = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en)) {
      expect(tokens(fr[key] ?? ''), key).toEqual(tokens(en[key]!));
    }
  });

  it('localizes, interpolates and falls back', () => {
    const hassFr = { language: 'fr' };
    expect(localize(hassFr, 'greeting.morning')).toBe('Bonjour');
    expect(localize({ language: 'fr-FR' }, 'climate.target', { temp: '21°C' })).toBe(
      'Cible : 21°C',
    );
    expect(localize({ language: 'de' }, 'greeting.morning')).toBe('Good morning');
    expect(localize(undefined, 'unknown.key')).toBe('unknown.key');
  });

  it('prefers the profile locale over the server language', () => {
    expect(languageOf({ language: 'en', locale: { language: 'fr' } })).toBe('fr');
  });
});
