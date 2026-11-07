export interface Mode {
  name: string;
  subtitle?: string;
  icon: string;
  /** Icon bubble color (any CSS color). */
  color?: string;
  /** Option of the card's `entity` (input_select / select) this mode selects. */
  option?: string;
  /** Entity watched for the active state (default: the card's `entity`). */
  entity?: string;
  /** State that means "this mode is active" (default: `option`). */
  state?: string;
}

/** True when the mode's entity currently has the state that marks the mode as active. */
export function isModeActive(
  mode: Mode,
  cardEntity: string | undefined,
  states: Record<string, { state: string } | undefined>,
): boolean {
  const entity = mode.entity ?? cardEntity;
  const expected = mode.state ?? mode.option;
  if (!entity || expected === undefined) return false;
  return states[entity]?.state === expected;
}
