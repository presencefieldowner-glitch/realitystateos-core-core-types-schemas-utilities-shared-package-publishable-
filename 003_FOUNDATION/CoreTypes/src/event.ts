/**
 * RealityStateOS — CoreTypes / Event
 * Implements RFC-0002 §5: the hash-chained, verifiable event envelope used
 * by the Verified Bus (module 004).
 */
import { Id, newId } from "./id";
import { Rfc3339, defaultClock } from "./timestamp";
import { sign, verify, hash, toHex, fromHex, KeyPair } from "./crypto";

export interface Event<TPayload = unknown> {
  eventId: Id;
  topic: string;
  schemaVersion: string; // semver
  occurredAt: Rfc3339;
  prevHash: string; // hex hash of the previous event in this topic's stream
  payload: TPayload;
  signatureHex?: string;
}

function signableBytes<T>(event: Omit<Event<T>, "signatureHex">): Uint8Array {
  const canonical = JSON.stringify({
    eventId: event.eventId,
    topic: event.topic,
    schemaVersion: event.schemaVersion,
    occurredAt: event.occurredAt,
    prevHash: event.prevHash,
    payload: event.payload,
  });
  return new TextEncoder().encode(canonical);
}

export const GENESIS_HASH = "0".repeat(64);

export function createEvent<T>(params: {
  topic: string;
  schemaVersion: string;
  payload: T;
  prevHash?: string;
}): Omit<Event<T>, "signatureHex"> {
  return {
    eventId: newId(),
    topic: params.topic,
    schemaVersion: params.schemaVersion,
    occurredAt: defaultClock.nowRfc3339(),
    prevHash: params.prevHash ?? GENESIS_HASH,
    payload: params.payload,
  };
}

export function signEvent<T>(
  event: Omit<Event<T>, "signatureHex">,
  keyPair: KeyPair
): Event<T> {
  const sig = sign(signableBytes(event), keyPair.privateKey);
  return { ...event, signatureHex: toHex(sig) };
}

export function verifyEvent<T>(event: Event<T>, publicKey: Uint8Array): boolean {
  if (!event.signatureHex) return false;
  const { signatureHex, ...unsigned } = event;
  return verify(fromHex(signatureHex), signableBytes(unsigned), publicKey);
}

/** Hash of a signed event — becomes the `prevHash` of the next event in the chain. */
export function eventHash<T>(event: Event<T>): string {
  return toHex(hash(new TextEncoder().encode(JSON.stringify(event))));
}

/**
 * Verify an entire ordered chain of events: each event's prevHash must match
 * the computed hash of the event before it, and every signature must be valid.
 * Mirrors the EventStore's tamper-evidence guarantee from formats.md.
 */
export function verifyChain<T>(events: Event<T>[], publicKey: Uint8Array): boolean {
  let expectedPrevHash = GENESIS_HASH;
  for (const event of events) {
    if (event.prevHash !== expectedPrevHash) return false;
    if (!verifyEvent(event, publicKey)) return false;
    expectedPrevHash = eventHash(event);
  }
  return true;
}
