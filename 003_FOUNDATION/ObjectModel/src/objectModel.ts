/**
 * RealityStateOS — Foundation / ObjectModel
 * The base struct every "thing" in the system extends: id, timestamps, version.
 * Builds directly on CoreTypes' EntityRecord envelope.
 */
import { Id } from "../../CoreTypes/dist/id";
import { Rfc3339 } from "../../CoreTypes/dist/timestamp";

/** Base fields every RealityStateOS object carries, independent of payload shape. */
export interface BaseObject {
  id: Id;
  createdAt: Rfc3339;
  updatedAt: Rfc3339;
  version: number;
}

/** Marker interface for objects that can be soft-deleted (tombstoned, never hard-removed —
 * preserves provenance per the Reality Tape / EventStore tamper-evidence guarantees). */
export interface Tombstonable {
  deletedAt?: Rfc3339;
}

export function isDeleted(obj: Tombstonable): boolean {
  return obj.deletedAt !== undefined;
}

/** A typed "kind" tag so generic storage/graph code can discriminate object types
 * at runtime without relying on JS `instanceof` (works across process/module boundaries). */
export interface Kinded {
  readonly kind: string;
}

export type RealityObject<TKind extends string, TPayload> = BaseObject &
  Kinded & { kind: TKind; payload: TPayload };
