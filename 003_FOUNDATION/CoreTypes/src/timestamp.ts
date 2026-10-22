/**
 * RealityStateOS — CoreTypes / Timestamp
 * Implements RFC-0002 §2: UTC, RFC 3339 timestamps.
 *
 * All timestamps flow through SystemClock (see 002_KERNEL/SystemClock in the
 * real kernel) so replay/simulation can override "now". This module is the
 * Foundation-level primitive that SystemClock will build on.
 */

export type Rfc3339 = string;

/** Format a Date as a UTC RFC 3339 string with millisecond precision. */
export function toRfc3339(date: Date): Rfc3339 {
  return date.toISOString(); // JS Date.toISOString() is already UTC RFC3339 (ms precision)
}

/** Parse an RFC 3339 string into a Date. Throws if malformed. */
export function fromRfc3339(value: Rfc3339): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid RFC3339 timestamp: "${value}"`);
  }
  return d;
}

/**
 * SystemClock — single source of truth for "now" in the system.
 * Swappable for deterministic testing and Reality Tape replay.
 */
export interface Clock {
  now(): Date;
  nowRfc3339(): Rfc3339;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
  nowRfc3339(): Rfc3339 {
    return toRfc3339(this.now());
  }
}

/** A fixed clock for tests and deterministic replay scenarios. */
export class FixedClock implements Clock {
  constructor(private fixed: Date) {}
  now(): Date {
    return this.fixed;
  }
  nowRfc3339(): Rfc3339 {
    return toRfc3339(this.fixed);
  }
  advance(ms: number): void {
    this.fixed = new Date(this.fixed.getTime() + ms);
  }
}

export const defaultClock: Clock = new SystemClock();
