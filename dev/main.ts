import { parse } from 'yaml';
import '../src/glass-home';
import './ha-icon-shim';
import sectionsYaml from '../examples/sections-view.yaml?raw';
import type { HomeAssistant } from '../src/shared/types';
import { createMockHass } from './mock-hass';
import { createSectionsFrame, type SectionsViewConfig } from './sections-sim';

/**
 * Local preview: renders examples/sections-view.yaml in a simulated Home Assistant **Sections** view
 * (see sections-sim.ts) at three screen sizes, against a fake Home Assistant.
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

const frames: Array<{ id: string; width: number; height: number }> = [
  { id: 'desktop', width: 1360, height: 780 },
  { id: 'tablet', width: 820, height: 740 },
  { id: 'phone', width: 390, height: 844 },
];

const root = document.getElementById('frames')!;
const views: Array<HTMLElement & { hass: HomeAssistant }> = [];

const hass = createMockHass(
  { language: params.get('lang') ?? 'en', dark: params.has('dark') },
  (next) => {
    for (const el of views) el.hass = next;
  },
);

const viewConfig = (): SectionsViewConfig =>
  (parse(sectionsYaml) as { views: SectionsViewConfig[] }).views[0]!;

for (const frame of frames) {
  if (only && only !== frame.id) continue;
  const wrapper = document.createElement('section');
  wrapper.className = `frame ${frame.id}`;
  wrapper.style.width = `${frame.width}px`;
  wrapper.style.height = `${frame.height}px`;
  wrapper.dataset.frame = frame.id;
  const sim = createSectionsFrame(
    viewConfig(),
    frame.width,
    frame.height,
    hass,
    params.has('dark'),
  );
  wrapper.append(sim.element);
  root.append(wrapper);
  views.push(sim.view);
}
