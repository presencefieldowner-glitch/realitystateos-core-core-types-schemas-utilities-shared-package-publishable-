/**
 * RealityStateOS — CoreTypes / EntityRecord
 * Implements RFC-0002 §4: the canonical entity envelope every module builds on.
 */
import { Id, newId } from "./id";
import { Rfc3339, defaultClock } from "./timestamp";
import { sign, verify, toHex, fromHex, KeyPair } from "./crypto";

export interface EntityRecord<TPayload = unknown> {
  id: Id;
  entityType: string;
  version: number; // monotonic per-entity version, starts at 1
  createdAt: Rfc3339;
  updatedAt: Rfc3339;
  createdBy: Id;
  payload: TPayload;
  signatureHex?: string; // present once signed
}

/** Deterministic byte encoding used as the signature message.
 * NOTE: production should use canonical Protobuf bytes per formats.md;
 * this JSON-based encoding is a placeholder pending the Protobuf codegen step. */
function signableBytes<T>(record: Omit<EntityRecord<T>, "signatureHex">): Uint8Array {
  const canonical = JSON.stringify({
    id: record.id,
    entityType: record.entityType,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdBy: record.createdBy,
    payload: record.payload,
  });
  return new TextEncoder().encode(canonical);
}

export function createEntityRecord<T>(params: {
  entityType: string;
  payload: T;
  createdBy: Id;
}): Omit<EntityRecord<T>, "signatureHex"> {
  const now = defaultClock.nowRfc3339();
  return {
    id: newId(),
    entityType: params.entityType,
    version: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: params.createdBy,
    payload: params.payload,
  };
}

export function signEntityRecord<T>(
  record: Omit<EntityRecord<T>, "signatureHex">,
  keyPair: KeyPair
): EntityRecord<T> {
  const sig = sign(signableBytes(record), keyPair.privateKey);
  return { ...record, signatureHex: toHex(sig) };
}

export function verifyEntityRecord<T>(
  record: EntityRecord<T>,
  publicKey: Uint8Array
): boolean {
  if (!record.signatureHex) return false;
  const { signatureHex, ...unsigned } = record;
  return verify(fromHex(signatureHex), signableBytes(unsigned), publicKey);
}

/** Produce a new version of a record (e.g. after a field update). Re-signing
 * is the caller's responsibility — this keeps EntityRecord logic pure. */
export function nextVersion<T>(
  record: EntityRecord<T>,
  newPayload: T
): Omit<EntityRecord<T>, "signatureHex"> {
  return {
    id: record.id,
    entityType: record.entityType,
    version: record.version + 1,
    createdAt: record.createdAt,
    updatedAt: defaultClock.nowRfc3339(),
    createdBy: record.createdBy,
    payload: newPayload,
  };
}
