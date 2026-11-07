function trim(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** True when `current` is `target` or one of its sub-paths. */
export function isActivePath(current: string, target: string): boolean {
  const a = trim(current);
  const b = trim(target.split(/[?#]/)[0] ?? target);
  return a === b || a.startsWith(`${b}/`);
}

/**
 * Splits items between the mobile bottom bar and the "More" sheet.
 * Items flagged `pin_mobile` win; without any flag, the first `max` items are used.
 */
export function splitMobileItems<T extends { pin_mobile?: boolean }>(
  items: T[],
  max: number,
): { bar: T[]; more: T[] } {
  const pinned = items.filter((i) => i.pin_mobile);
  const bar = pinned.length > 0 ? pinned.slice(0, max) : items.slice(0, max);
  return { bar, more: items.filter((i) => !bar.includes(i)) };
}
