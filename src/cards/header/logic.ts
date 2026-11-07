import type { HomeAssistant } from '../../shared/types';

/** Translation key of the greeting for a given hour (0-23). */
export function greetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'greeting.morning';
  if (hour >= 12 && hour < 18) return 'greeting.afternoon';
  if (hour >= 18 && hour < 22) return 'greeting.evening';
  return 'greeting.night';
}

interface WeatherLook {
  icon: string;
  color: string;
}

const WEATHER: Record<string, WeatherLook> = {
  sunny: { icon: 'mdi:weather-sunny', color: '#ffb200' },
  'clear-night': { icon: 'mdi:weather-night', color: '#7b8cff' },
  partlycloudy: { icon: 'mdi:weather-partly-cloudy', color: '#ffb200' },
  cloudy: { icon: 'mdi:weather-cloudy', color: '#7f8aa3' },
  rainy: { icon: 'mdi:weather-rainy', color: '#3b82f6' },
  pouring: { icon: 'mdi:weather-pouring', color: '#2f6bff' },
  snowy: { icon: 'mdi:weather-snowy', color: '#7fb4ff' },
  'snowy-rainy': { icon: 'mdi:weather-snowy-rainy', color: '#7fb4ff' },
  hail: { icon: 'mdi:weather-hail', color: '#7fb4ff' },
  fog: { icon: 'mdi:weather-fog', color: '#8b95ab' },
  windy: { icon: 'mdi:weather-windy', color: '#7f8aa3' },
  'windy-variant': { icon: 'mdi:weather-windy-variant', color: '#7f8aa3' },
  lightning: { icon: 'mdi:weather-lightning', color: '#ffb200' },
  'lightning-rainy': { icon: 'mdi:weather-lightning-rainy', color: '#ffb200' },
  exceptional: { icon: 'mdi:alert-circle-outline', color: '#ff453a' },
};

export function weatherLook(condition: string | undefined): WeatherLook {
  return (condition && WEATHER[condition]) || { icon: 'mdi:weather-cloudy', color: '#7f8aa3' };
}

/** The person entity linked to the logged-in HA user, if any. */
export function currentPerson(hass: HomeAssistant | undefined): string | undefined {
  const userId = hass?.user?.id;
  if (!hass || !userId) return undefined;
  return Object.keys(hass.states).find(
    (id) => id.startsWith('person.') && hass.states[id]?.attributes.user_id === userId,
  );
}
