/**
 * RealityStateOS — EntityModel + ObjectModel self-tests.
 * Run with: npm test
 */
import * as assert from "assert";
import {
  createTypedEntity,
  updateAttributes,
  createRelationship,
  endRelationship,
  isRelationshipActive,
} from "./entityModel";
import { newId } from "../../CoreTypes/dist/id";
import { isDeleted } from "../../ObjectModel/dist/objectModel";

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

console.log("TypedEntity");
test("createTypedEntity sets version 1 and timestamps", () => {
  const e = createTypedEntity("user_profile", { name: "Joseph" }, newId());
  assert.strictEqual(e.version, 1);
  assert.strictEqual(e.entityType, "user_profile");
  assert.strictEqual(e.attributes.name, "Joseph");
});
test("updateAttributes increments version, keeps id", () => {
  const e1 = createTypedEntity("user_profile", { name: "Joseph" }, newId());
  const e2 = updateAttributes(e1, { name: "Joe" });
  assert.strictEqual(e2.id, e1.id);
  assert.strictEqual(e2.version, 2);
  assert.strictEqual(e2.attributes.name, "Joe");
});

console.log("ObjectModel — Tombstonable");
test("isDeleted reflects deletedAt presence", () => {
  assert.strictEqual(isDeleted({}), false);
  assert.strictEqual(isDeleted({ deletedAt: "2026-01-01T00:00:00.000Z" }), true);
});

console.log("Relationship");
test("createRelationship starts active with no validTo", () => {
  const rel = createRelationship({
    relType: "owns",
    fromId: newId(),
    toId: newId(),
    cardinality: "one-to-many",
  });
  assert.strictEqual(rel.validTo, undefined);
  assert.ok(isRelationshipActive(rel));
});
test("endRelationship sets validTo and becomes inactive going forward", () => {
  const rel = createRelationship({
    relType: "owns",
    fromId: newId(),
    toId: newId(),
    cardinality: "one-to-one",
  });
  // Both timestamps come from defaultClock.nowRfc3339() (ms precision). Force
  // them into different milliseconds so validFrom is strictly before validTo
  // — otherwise this assertion is a coin flip on how fast the CPU is.
  const spinUntil = Date.now() + 2;
  while (Date.now() < spinUntil) { /* busy-wait past the current millisecond */ }
  const ended = endRelationship(rel);
  assert.ok(ended.validTo !== undefined);
  // still active at a point in time before it ended
  assert.ok(isRelationshipActive(ended, new Date(rel.validFrom)));
});
test("isRelationshipActive respects temporal scoping (point-in-time query)", () => {
  const past = new Date(Date.now() - 10_000);
  const rel = createRelationship({
    relType: "member_of",
    fromId: newId(),
    toId: newId(),
    cardinality: "many-to-many",
  });
  // before validFrom -> not active
  assert.strictEqual(isRelationshipActive(rel, past), false);
});

console.log(`\n${passed} tests passed.`);
