import { isMediaSource, toCssBackground } from '../src/shared/view';
import { isActivePath, splitMobileItems } from '../src/cards/sidebar/logic';
import { describe, expect, it } from 'vitest';
import { powerDigits, toKw } from '../src/cards/energy/logic';
import { greetingKey, weatherLook } from '../src/cards/header/logic';
import { allEntities, countOn, masterService } from '../src/cards/lights/logic';
import { isModeActive } from '../src/cards/modes/logic';
import { nextTarget } from '../src/cards/climate/logic';
import { insecureDoors, securityView } from '../src/cards/security/logic';
import { isSameDay, parseEventStart } from '../src/cards/quick-info/logic';

describe('climate', () => {
  it('steps, snaps to the grid and clamps', () => {
    expect(nextTarget(21, 1, 0.5)).toBe(21.5);
    expect(nextTarget(21.2, 1, 0.5)).toBe(21.5);
    expect(nextTarget(30, 1, 0.5, 7, 30)).toBe(30);
    expect(nextTarget(7, -1, 0.5, 7, 30)).toBe(7);
  });
});

describe('lights', () => {
  const rooms = [
    { name: 'A', entities: ['light.a', 'light.b'] },
    { name: 'B', entities: ['light.b', 'light.c'] },
  ];
  it('dedupes entities and counts the ones that are on', () => {
    expect(allEntities(rooms)).toEqual(['light.a', 'light.b', 'light.c']);
    const states = { 'light.a': { state: 'on' }, 'light.c': { state: 'off' } };
    expect(countOn(states, allEntities(rooms))).toBe(1);
  });
  it('master switch turns everything off when something is on', () => {
    expect(masterService(2)).toBe('turn_off');
    expect(masterService(0)).toBe('turn_on');
  });
});

describe('security', () => {
  it('maps alarm states', () => {
    expect(securityView('disarmed').tone).toBe('ok');
    expect(securityView('armed_night').labelKey).toBe('security.armed_night');
    expect(securityView('triggered').tone).toBe('alert');
    expect(securityView('weird').tone).toBe('unknown');
  });
  it('detects insecure doors and ignores unavailable ones', () => {
    const states = {
      'binary_sensor.front': { state: 'on' },
      'lock.back': { state: 'locked' },
      'cover.garage': { state: 'closed' },
      'binary_sensor.side': { state: 'unavailable' },
    };
    expect(insecureDoors(states, Object.keys(states))).toEqual(['binary_sensor.front']);
  });
});

describe('energy', () => {
  it('converts to kW', () => {
    expect(toKw(1200, 'W')).toEqual({ value: 1.2, unit: 'kW' });
    expect(toKw(1.2, 'kW')).toEqual({ value: 1.2, unit: 'kW' });
    expect(toKw(5, undefined)).toEqual({ value: 5, unit: '' });
    expect(powerDigits(1.2)).toBe(1);
    expect(powerDigits(12)).toBe(0);
  });
});

describe('header', () => {
  it('picks the greeting from the hour', () => {
    expect(greetingKey(8)).toBe('greeting.morning');
    expect(greetingKey(14)).toBe('greeting.afternoon');
    expect(greetingKey(20)).toBe('greeting.evening');
    expect(greetingKey(2)).toBe('greeting.night');
  });
  it('falls back for unknown weather', () => {
    expect(weatherLook('sunny').icon).toBe('mdi:weather-sunny');
    expect(weatherLook('???').icon).toBe('mdi:weather-cloudy');
  });
});

describe('modes', () => {
  const states = { 'input_select.mode': { state: 'Night' } };
  it('is active when the entity state equals the option', () => {
    expect(
      isModeActive({ name: 'n', icon: 'i', option: 'Night' }, 'input_select.mode', states),
    ).toBe(true);
    expect(
      isModeActive({ name: 'h', icon: 'i', option: 'Home' }, 'input_select.mode', states),
    ).toBe(false);
    expect(isModeActive({ name: 'x', icon: 'i' }, 'input_select.mode', states)).toBe(false);
  });
});

describe('quick-info', () => {
  it('parses calendar start times as local time', () => {
    const d = parseEventStart('2026-11-07 11:00:00')!;
    expect(d.getHours()).toBe(11);
    expect(parseEventStart('nope')).toBeUndefined();
    expect(isSameDay(d, new Date(2026, 10, 7, 23, 0))).toBe(true);
  });
});

describe('sidebar', () => {
  it('matches the active path and its sub-paths', () => {
    expect(isActivePath('/dash/lights', '/dash/lights')).toBe(true);
    expect(isActivePath('/dash/lights/', '/dash/lights')).toBe(true);
    expect(isActivePath('/dash/lights/sub', '/dash/lights')).toBe(true);
    expect(isActivePath('/dash/lightsx', '/dash/lights')).toBe(false);
  });
  it('splits mobile items: pinned first, else the first N', () => {
    const items: Array<{ id: number; pin_mobile?: boolean }> = [
      { id: 1 },
      { id: 2, pin_mobile: true },
      { id: 3 },
      { id: 4, pin_mobile: true },
    ];
    expect(splitMobileItems(items, 4).bar.map((i) => i.id)).toEqual([2, 4]);
    expect(splitMobileItems(items, 4).more.map((i) => i.id)).toEqual([1, 3]);
    const plain: Array<{ id: number; pin_mobile?: boolean }> = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(splitMobileItems(plain, 2).bar.map((i) => i.id)).toEqual([1, 2]);
    expect(splitMobileItems(plain, 5).more).toEqual([]);
  });
});

describe('background', () => {
  it('detects media sources', () => {
    expect(isMediaSource('media-source://image_upload/abc')).toBe(true);
    expect(isMediaSource('/local/a.jpg')).toBe(false);
  });
  it('builds a CSS background', () => {
    expect(toCssBackground('/local/a.jpg')).toContain('url("/local/a.jpg")');
    expect(toCssBackground('media-source://x/y', '/api/image/serve/y/original')).toContain(
      '/api/image/serve/y/original',
    );
    expect(toCssBackground('center / cover url(/a.jpg)')).toBe('center / cover url(/a.jpg)');
  });
});
