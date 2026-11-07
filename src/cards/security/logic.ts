export type SecurityTone = 'ok' | 'armed' | 'alert' | 'pending' | 'unknown';

export interface SecurityView {
  tone: SecurityTone;
  icon: string;
  /** Translation key of the status label. */
  labelKey: string;
}

/** Maps an alarm_control_panel state to what the card shows. */
export function securityView(state: string): SecurityView {
  switch (state) {
    case 'disarmed':
      return { tone: 'ok', icon: 'mdi:shield-check', labelKey: 'security.disarmed' };
    case 'armed_home':
    case 'armed_away':
    case 'armed_night':
    case 'armed_vacation':
    case 'armed_custom_bypass':
      return { tone: 'armed', icon: 'mdi:shield-lock', labelKey: `security.${state}` };
    case 'arming':
    case 'pending':
    case 'disarming':
      return { tone: 'pending', icon: 'mdi:shield-sync', labelKey: `security.${state}` };
    case 'triggered':
      return { tone: 'alert', icon: 'mdi:shield-alert', labelKey: 'security.triggered' };
    default:
      return { tone: 'unknown', icon: 'mdi:shield-off', labelKey: 'security.unknown' };
  }
}

const SECURE_STATES = new Set(['closed', 'locked', 'off']);

/** Ids of door entities that are open/unlocked (unavailable ones are ignored). */
export function insecureDoors(
  states: Record<string, { state: string } | undefined>,
  ids: string[],
): string[] {
  return ids.filter((id) => {
    const s = states[id]?.state;
    return s !== undefined && s !== 'unavailable' && s !== 'unknown' && !SECURE_STATES.has(s);
  });
}

export type ArmMode = 'home' | 'away' | 'night';

export const ARM_SERVICE: Record<ArmMode, string> = {
  home: 'alarm_arm_home',
  away: 'alarm_arm_away',
  night: 'alarm_arm_night',
};
