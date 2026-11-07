import type { HassEntity, HomeAssistant } from '../src/shared/types';

/**
 * Fake Home Assistant used by the local preview (`npm run dev`).
 * Entity ids match examples/dashboard.yaml. Service calls mutate the states so
 * every interaction (toggle a light, arm the alarm, change volume…) is visible.
 */

const svg = (body: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">${body}</svg>`)}`;

const CAMERA_PICTURE = svg(
  `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b8bc4"/><stop offset="1" stop-color="#e8b79a"/></linearGradient></defs>
   <rect width="320" height="180" fill="url(#s)"/>
   <rect x="0" y="130" width="320" height="50" fill="#4a5a43"/>
   <rect x="90" y="50" width="140" height="90" fill="#8d8f99"/>
   <rect x="140" y="70" width="40" height="70" fill="#2a2620"/>
   <rect x="148" y="78" width="24" height="62" fill="#c98f4a" opacity=".8"/>`,
);

const MEDIA_PICTURE = svg(
  `<defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b8fd8"/><stop offset="1" stop-color="#e9c8a0"/></linearGradient></defs>
   <rect width="320" height="180" fill="url(#m)"/>
   <path d="M0 180 L110 60 L160 110 L215 40 L320 180Z" fill="#4c4f63"/>
   <path d="M195 62 L215 40 L236 66 L215 58Z" fill="#fff"/>`,
);

const now = new Date();
const todayAt = (h: number, m: number): string => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(h)}:${p(m)}:00`;
};

function entity(id: string, state: string, attributes: Record<string, unknown> = {}): HassEntity {
  const stamp = new Date().toISOString();
  return { entity_id: id, state, attributes, last_changed: stamp, last_updated: stamp };
}

function initialStates(): Record<string, HassEntity> {
  const list = [
    entity('weather.home', 'sunny', { temperature: 14, humidity: 68, temperature_unit: '°C' }),
    entity('person.alex', 'home', { friendly_name: 'Alex Martin', user_id: 'user-1' }),
    entity('input_select.house_mode', 'Home', { options: ['Home', 'Night', 'Away', 'Eco'] }),
    entity('climate.living_room', 'heat', {
      friendly_name: 'Living Room',
      current_temperature: 21.5,
      temperature: 21,
      target_temp_step: 0.5,
      min_temp: 7,
      max_temp: 30,
    }),
    entity('light.living_room_main', 'on', { friendly_name: 'Living Room Main' }),
    entity('light.living_room_lamp', 'on', { friendly_name: 'Living Room Lamp' }),
    entity('light.kitchen', 'off', { friendly_name: 'Kitchen' }),
    entity('light.bedroom_ceiling', 'on', { friendly_name: 'Bedroom Ceiling' }),
    entity('light.bedroom_bedside', 'off', { friendly_name: 'Bedroom Bedside' }),
    entity('light.office', 'off', { friendly_name: 'Office' }),
    entity('camera.front_door', 'idle', {
      friendly_name: 'Front Door',
      entity_picture: CAMERA_PICTURE,
    }),
    entity('alarm_control_panel.home', 'disarmed', {
      friendly_name: 'Home Alarm',
      code_format: null,
    }),
    entity('lock.front_door', 'locked', { friendly_name: 'Front Door' }),
    entity('cover.garage_door', 'closed', { friendly_name: 'Garage', device_class: 'garage' }),
    entity('sensor.house_power', '1200', {
      friendly_name: 'House power',
      unit_of_measurement: 'W',
    }),
    entity('media_player.living_room', 'playing', {
      friendly_name: 'Living Room Speaker',
      media_title: 'Chill Vibes',
      app_name: 'Ambient Radio',
      entity_picture: MEDIA_PICTURE,
      volume_level: 0.6,
      is_volume_muted: false,
    }),
    entity('calendar.work', 'off', {
      friendly_name: 'Work',
      message: 'Team Sync',
      start_time: todayAt(11, 0),
      all_day: false,
    }),
  ];
  return Object.fromEntries(list.map((e) => [e.entity_id, e]));
}

/** Smooth fake history so charts have something to draw. */
function fakeHistory(entityId: string, startMs: number, endMs: number) {
  const out: Array<Record<string, unknown>> = [];
  const step = 30 * 60 * 1000;
  for (let t = startMs; t <= endMs; t += step) {
    const hour = new Date(t).getHours() + new Date(t).getMinutes() / 60;
    const seconds = t / 1000;
    if (entityId.startsWith('climate.')) {
      const v = 19.5 + 2.4 * Math.sin(((hour - 5) / 24) * Math.PI * 2 - 0.4) + hour * 0.04;
      out.push({ s: 'heat', a: { current_temperature: Math.round(v * 10) / 10 }, lu: seconds });
    } else {
      const base = 350 + 250 * Math.sin(hour / 3.2);
      const peak =
        1500 * Math.exp(-Math.pow(hour - 8, 2) / 2) + 1800 * Math.exp(-Math.pow(hour - 19, 2) / 3);
      out.push({ s: String(Math.round(Math.max(120, base + peak))), lu: seconds });
    }
  }
  return out;
}

export function createMockHass(
  options: { language?: string; dark?: boolean },
  onChange: (hass: HomeAssistant) => void,
): HomeAssistant {
  let states = initialStates();
  let hass: HomeAssistant;

  const publish = (changes: Record<string, HassEntity>): void => {
    states = { ...states, ...changes };
    hass = { ...hass, states };
    onChange(hass);
  };

  const patch = (id: string, state?: string, attrs: Record<string, unknown> = {}): void => {
    const current = states[id];
    if (!current) return;
    publish({
      [id]: {
        ...current,
        state: state ?? current.state,
        attributes: { ...current.attributes, ...attrs },
        last_updated: new Date().toISOString(),
      },
    });
  };

  const idsOf = (
    data: Record<string, unknown> | undefined,
    target?: { entity_id?: string | string[] },
  ) =>
    ([] as string[]).concat(
      (data?.entity_id as string | string[] | undefined) ?? target?.entity_id ?? [],
    );

  hass = {
    states,
    language: options.language ?? 'en',
    locale: { language: options.language ?? 'en', time_format: 'language' },
    themes: { darkMode: options.dark ?? false },
    user: { id: 'user-1', name: 'Alex Martin' },
    config: { unit_system: { temperature: '°C' } },
    hassUrl: (path = '') => path,
    formatEntityState: (s) => s.state.charAt(0).toUpperCase() + s.state.slice(1),
    callWS: async <T>(message: Record<string, unknown>) => {
      if (message.type === 'history/history_during_period') {
        const id = (message.entity_ids as string[])[0]!;
        const start = Date.parse(message.start_time as string);
        const end = Date.parse(message.end_time as string);
        return { [id]: fakeHistory(id, start, end) } as T;
      }
      return {} as T;
    },
    callService: async (domain, service, data, target) => {
      const ids = idsOf(data, target);
      console.info('[mock] callService', `${domain}.${service}`, data, target);
      const key = `${domain}.${service}`;
      for (const id of ids) {
        const current = states[id];
        switch (key) {
          case 'homeassistant.turn_on':
            patch(id, 'on');
            break;
          case 'homeassistant.turn_off':
            patch(id, 'off');
            break;
          case 'homeassistant.toggle':
            patch(id, current?.state === 'on' ? 'off' : 'on');
            break;
          case 'input_select.select_option':
            patch(id, String(data?.option));
            break;
          case 'climate.set_temperature':
            patch(id, undefined, { temperature: data?.temperature });
            break;
          case 'alarm_control_panel.alarm_arm_home':
            patch(id, 'armed_home');
            break;
          case 'alarm_control_panel.alarm_arm_away':
            patch(id, 'armed_away');
            break;
          case 'alarm_control_panel.alarm_arm_night':
            patch(id, 'armed_night');
            break;
          case 'alarm_control_panel.alarm_disarm':
            patch(id, 'disarmed');
            break;
          case 'media_player.media_play_pause':
            patch(id, current?.state === 'playing' ? 'paused' : 'playing');
            break;
          case 'media_player.volume_set':
            patch(id, undefined, { volume_level: data?.volume_level });
            break;
          case 'media_player.volume_mute':
            patch(id, undefined, { is_volume_muted: data?.is_volume_muted });
            break;
        }
      }
    },
  };

  // Mimic HA's card helpers so non-glass cards could also be used in the preview.
  window.loadCardHelpers = async () => ({
    createCardElement(config) {
      const el = document.createElement(config.type.replace(/^custom:/, ''));
      (el as HTMLElement & { setConfig?: (c: unknown) => void }).setConfig?.(config);
      return el;
    },
  });

  return hass;
}
