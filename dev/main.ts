import { parse } from 'yaml';
import '../src/glass-home';
import './ha-icon-shim';
import dashboardYaml from '../examples/dashboard.yaml?raw';
import type { HomeAssistant, LovelaceCardConfig } from '../src/shared/types';
import { createMockHass } from './mock-hass';

/**
 * Local preview: renders examples/dashboard.yaml three times
 * (desktop / tablet / phone) against a fake Home Assistant.
 *
 *   ?lang=fr   French UI        ?dark=1   dark theme
 *   ?only=desktop|tablet|phone  render a single frame
 */
window.addEventListener('unhandledrejection', (e) =>
  console.error('UNHANDLED', (e.reason as Error)?.stack ?? e.reason),
);
window.addEventListener('error', (e) => console.error('ERROR', e.error?.stack ?? e.message));

const params = new URLSearchParams(location.search);
const only = params.get('only');

const dashboard = parse(dashboardYaml) as { views: Array<{ cards: LovelaceCardConfig[] }> };
const layoutConfig = dashboard.views[0]!.cards[0]!;
// The preview lives at /dev/, so make the "Overview" item match that path (active highlight).
const sidebar = layoutConfig.sidebar as { items: Array<{ navigation_path: string }> };
sidebar.items[0]!.navigation_path = '/dev/';

const frames: Array<{ id: string; width: number; height: number }> = [
  { id: 'desktop', width: 1360, height: 780 },
  { id: 'tablet', width: 820, height: 740 },
  { id: 'phone', width: 390, height: 844 },
];

const root = document.getElementById('frames')!;
const layouts: Array<HTMLElement & { hass?: HomeAssistant }> = [];

const hass = createMockHass(
  { language: params.get('lang') ?? 'en', dark: params.has('dark') },
  (next) => {
    for (const el of layouts) el.hass = next;
  },
);

for (const frame of frames) {
  if (only && only !== frame.id) continue;
  const wrapper = document.createElement('section');
  wrapper.className = `frame ${frame.id}`;
  wrapper.style.width = `${frame.width}px`;
  wrapper.style.height = `${frame.height}px`;
  wrapper.dataset.frame = frame.id;

  const layout = document.createElement('glass-layout-card') as HTMLElement & {
    setConfig(c: LovelaceCardConfig): void;
    hass?: HomeAssistant;
  };
  layout.style.setProperty('--glass-view-height', `${frame.height}px`);
  layout.setConfig(layoutConfig);
  layout.hass = hass;
  wrapper.append(layout);
  root.append(wrapper);
  layouts.push(layout);
}
