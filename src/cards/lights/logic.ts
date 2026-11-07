export interface LightRoom {
  name: string;
  icon?: string;
  /** light.* / switch.* / group entities of the room. */
  entities: string[];
}

/** Unique entity ids across all rooms (order preserved). */
export function allEntities(rooms: LightRoom[]): string[] {
  return [...new Set(rooms.flatMap((r) => r.entities))];
}

export function isOn(states: Record<string, { state: string } | undefined>, id: string): boolean {
  return states[id]?.state === 'on';
}

export function countOn(
  states: Record<string, { state: string } | undefined>,
  ids: string[],
): number {
  return ids.filter((id) => isOn(states, id)).length;
}

/** Service to call for the master toggle: turn everything off if anything is on. */
export function masterService(onCount: number): 'turn_on' | 'turn_off' {
  return onCount > 0 ? 'turn_off' : 'turn_on';
}
