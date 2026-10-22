/**
 * RealityStateOS — CoreTypes / Cryptography
 * Implements RFC-0002 §3 signature requirements: Ed25519 signing/verification
 * used by EntityRecord and Event envelopes, plus BLAKE3 hashing for the
 * EventStore hash chain.
 */
import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { blake3 } from "@noble/hashes/blake3.js";

// @noble/ed25519 v3 requires an explicit sha512 implementation to be wired in.
ed25519.hashes.sha512 = sha512;

export interface KeyPair {
  privateKey: Uint8Array; // 32 bytes (secretKey)
  publicKey: Uint8Array; // 32 bytes
}

export function generateKeyPair(): KeyPair {
  const kp = ed25519.keygen();
  return { privateKey: kp.secretKey, publicKey: kp.publicKey };
}

export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}

export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return ed25519.verify(signature, message, publicKey);
}

/** BLAKE3 per RFC-0002 §3 — used for on-disk/EventStore hash chaining. */
export function hash(data: Uint8Array): Uint8Array {
  return blake3(data);
}

export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

export function fromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, "hex"));
}
