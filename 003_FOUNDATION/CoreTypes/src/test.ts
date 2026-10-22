/**
 * RealityStateOS — CoreTypes self-tests.
 * Plain assertion script (no external test framework) — run with:
 *   npm run build && node dist/test.js
 */
import * as assert from "assert";
import { newId, isValidId, idTimestampMs } from "./id";
import { toRfc3339, fromRfc3339, FixedClock } from "./timestamp";
import { ok, err, isOk, isErr, unwrap } from "./result";
import { generateKeyPair, sign, verify } from "./crypto";
import { createEntityRecord, signEntityRecord, verifyEntityRecord, nextVersion } from "./entityRecord";
import { createEvent, signEvent, verifyEvent, verifyChain, eventHash, GENESIS_HASH } from "./event";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Id");
test("newId generates a valid ULID", () => {
  const id = newId();
  assert.strictEqual(id.length, 26);
  assert.ok(isValidId(id));
});
test("idTimestampMs recovers a sane creation time", () => {
  const before = Date.now();
  const id = newId();
  const ts = idTimestampMs(id);
  assert.ok(ts >= before - 1000 && ts <= Date.now() + 1000);
});
test("isValidId rejects garbage", () => {
  assert.strictEqual(isValidId("not-a-ulid"), false);
});

console.log("Timestamp");
test("round-trips RFC3339", () => {
  const d = new Date("2026-07-21T14:03:22.104Z");
  assert.strictEqual(toRfc3339(fromRfc3339(toRfc3339(d))), toRfc3339(d));
});
test("FixedClock is deterministic and advances", () => {
  const clock = new FixedClock(new Date("2026-01-01T00:00:00.000Z"));
  const t1 = clock.nowRfc3339();
  clock.advance(1000);
  const t2 = clock.nowRfc3339();
  assert.notStrictEqual(t1, t2);
});

console.log("Result");
test("ok/err/isOk/isErr behave", () => {
  const good = ok(42);
  const bad = err("boom");
  assert.ok(isOk(good) && good.value === 42);
  assert.ok(isErr(bad) && bad.error === "boom");
  assert.strictEqual(unwrap(good), 42);
});

console.log("Crypto");
test("sign/verify round trip", () => {
  const kp = generateKeyPair();
  const msg = new TextEncoder().encode("reality state");
  const sig = sign(msg, kp.privateKey);
  assert.ok(verify(sig, msg, kp.publicKey));
});
test("verify fails on tampered message", () => {
  const kp = generateKeyPair();
  const sig = sign(new TextEncoder().encode("original"), kp.privateKey);
  assert.strictEqual(verify(sig, new TextEncoder().encode("tampered"), kp.publicKey), false);
});

console.log("EntityRecord");
test("create + sign + verify a record", () => {
  const kp = generateKeyPair();
  const unsigned = createEntityRecord({
    entityType: "user_profile",
    payload: { displayName: "Joseph" },
    createdBy: newId(),
  });
  const signed = signEntityRecord(unsigned, kp);
  assert.ok(verifyEntityRecord(signed, kp.publicKey));
});
test("verify fails with wrong public key", () => {
  const kp = generateKeyPair();
  const other = generateKeyPair();
  const signed = signEntityRecord(
    createEntityRecord({ entityType: "x", payload: {}, createdBy: newId() }),
    kp
  );
  assert.strictEqual(verifyEntityRecord(signed, other.publicKey), false);
});
test("nextVersion increments version and keeps identity", () => {
  const kp = generateKeyPair();
  const v1 = signEntityRecord(
    createEntityRecord({ entityType: "profile", payload: { n: 1 }, createdBy: newId() }),
    kp
  );
  const v2unsigned = nextVersion(v1, { n: 2 });
  assert.strictEqual(v2unsigned.id, v1.id);
  assert.strictEqual(v2unsigned.version, 2);
});

console.log("Event chain");
test("single event verifies", () => {
  const kp = generateKeyPair();
  const signed = signEvent(createEvent({ topic: "presence.updated", schemaVersion: "1.0.0", payload: { x: 1 } }), kp);
  assert.ok(verifyEvent(signed, kp.publicKey));
});
test("chain of 3 events verifies end to end", () => {
  const kp = generateKeyPair();
  const e1 = signEvent(createEvent({ topic: "t", schemaVersion: "1.0.0", payload: 1 }), kp);
  const e2 = signEvent(createEvent({ topic: "t", schemaVersion: "1.0.0", payload: 2, prevHash: eventHash(e1) }), kp);
  const e3 = signEvent(createEvent({ topic: "t", schemaVersion: "1.0.0", payload: 3, prevHash: eventHash(e2) }), kp);
  assert.ok(verifyChain([e1, e2, e3], kp.publicKey));
});
test("tampered chain (wrong prevHash) fails verification", () => {
  const kp = generateKeyPair();
  const e1 = signEvent(createEvent({ topic: "t", schemaVersion: "1.0.0", payload: 1 }), kp);
  const e2 = signEvent(createEvent({ topic: "t", schemaVersion: "1.0.0", payload: 2, prevHash: "deadbeef" }), kp);
  assert.strictEqual(verifyChain([e1, e2], kp.publicKey), false);
});
test("first event in a fresh chain uses GENESIS_HASH", () => {
  const e1 = createEvent({ topic: "t", schemaVersion: "1.0.0", payload: 1 });
  assert.strictEqual(e1.prevHash, GENESIS_HASH);
});

console.log(`\n${passed} tests passed.`);
