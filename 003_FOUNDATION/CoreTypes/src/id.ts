/**
 * RealityStateOS — CoreTypes / Id
 * Implements RFC-0002 (formats.md) §1: ULID identifiers.
 *
 * Every entity, event, and node/edge in the system uses a ULID as its
 * primary key — no auto-increment integers anywhere.
 */
import { ulid, decodeTime, isValid } from "ulid";

export type Id = string; // 26-char ULID, validated at construction boundaries

export class InvalidIdError extends Error {
  constructor(value: string) {
    super(`Invalid RealityStateOS ID (expected ULID): "${value}"`);
    this.name = "InvalidIdError";
  }
}

/** Generate a new, lexicographically-sortable ID. */
export function newId(): Id {
  return ulid();
}

/** Validate that a string is a well-formed ULID. Throws InvalidIdError if not. */
export function assertValidId(value: string): Id {
  if (!isValid(value)) {
    throw new InvalidIdError(value);
  }
  return value;
}

/** Non-throwing validity check. */
export function isValidId(value: string): boolean {
  return isValid(value);
}

/** Extract the embedded creation timestamp (ms since epoch) from a ULID. */
export function idTimestampMs(id: Id): number {
  return decodeTime(assertValidId(id));
}
