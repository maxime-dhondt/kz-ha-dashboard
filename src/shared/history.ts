import { toNumber } from './entities';
import type { HomeAssistant } from './types';

export interface Point {
  /** Timestamp in milliseconds. */
  t: number;
  v: number;
}

interface HistoryState {
  s?: string;
  a?: Record<string, unknown>;
  lu?: number;
  lc?: number;
}

/**
 * Loads a numeric series through the HA websocket `history/history_during_period`.
 * With `attribute`, the series is read from that attribute (e.g. a climate's
 * `current_temperature`); otherwise from the state itself.
 */
export async function fetchHistory(
  hass: HomeAssistant,
  entityId: string,
  start: Date,
  end: Date,
  attribute?: string,
): Promise<Point[]> {
  const result = await hass.callWS<Record<string, HistoryState[]>>({
    type: 'history/history_during_period',
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    entity_ids: [entityId],
    include_start_time_state: true,
    significant_changes_only: false,
    minimal_response: !attribute,
    no_attributes: !attribute,
  });

  const points: Point[] = [];
  for (const entry of result[entityId] ?? []) {
    const seconds = entry.lu ?? entry.lc;
    const value = attribute ? toNumber(entry.a?.[attribute]) : toNumber(entry.s);
    if (seconds === undefined || value === undefined) continue;
    points.push({ t: seconds * 1000, v: value });
  }
  return points;
}

export interface BucketOptions {
  start: number;
  end: number;
  buckets: number;
  /** Ignore time after this instant (defaults to `end`); later buckets are null. */
  until?: number;
}

/**
 * Resamples a step series (value holds until the next change) into `buckets`
 * equal slots using a time-weighted average. Slots with no data are `null`.
 */
export function bucketize(points: Point[], options: BucketOptions): Array<number | null> {
  const sorted = [...points].sort((a, b) => a.t - b.t);
  const until = options.until ?? options.end;
  const size = (options.end - options.start) / options.buckets;
  const out: Array<number | null> = [];

  for (let i = 0; i < options.buckets; i++) {
    const bucketStart = options.start + i * size;
    const bucketEnd = Math.min(bucketStart + size, until);
    if (bucketEnd <= bucketStart) {
      out.push(null);
      continue;
    }

    let last = -1;
    for (let k = 0; k < sorted.length && sorted[k]!.t <= bucketStart; k++) last = k;
    let current: number | null = last >= 0 ? sorted[last]!.v : null;
    let cursor = bucketStart;
    let weighted = 0;
    let covered = 0;

    for (let k = last + 1; k < sorted.length && sorted[k]!.t < bucketEnd; k++) {
      const point = sorted[k]!;
      if (current !== null) {
        weighted += current * (point.t - cursor);
        covered += point.t - cursor;
      }
      cursor = point.t;
      current = point.v;
    }
    if (current !== null) {
      weighted += current * (bucketEnd - cursor);
      covered += bucketEnd - cursor;
    }
    out.push(covered > 0 ? weighted / covered : null);
  }
  return out;
}
