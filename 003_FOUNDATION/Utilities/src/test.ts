import * as assert from "assert";
import { deepEqual, deepClone, assertDefined, retry, sleep, groupBy } from "./utilities";

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ok  - ${name}`);
    })
    .catch((e) => {
      console.error(`FAIL - ${name}`);
      console.error(e);
      process.exitCode = 1;
    });
}

async function main() {
  console.log("deepEqual");
  await test("primitives", () => {
    assert.strictEqual(deepEqual(1, 1), true);
    assert.strictEqual(deepEqual(1, 2), false);
  });
  await test("nested objects and arrays, order-independent keys", () => {
    assert.strictEqual(deepEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }), true);
    assert.strictEqual(deepEqual({ a: 1 }, { a: 2 }), false);
  });

  console.log("deepClone");
  await test("produces an independent copy", () => {
    const original = { a: { b: 1 } };
    const clone = deepClone(original);
    clone.a.b = 2;
    assert.strictEqual(original.a.b, 1);
  });

  console.log("assertDefined");
  await test("passes through defined values", () => {
    assert.strictEqual(assertDefined(5, "should not throw"), 5);
  });
  await test("throws on undefined/null", () => {
    assert.throws(() => assertDefined(undefined, "was undefined"));
    assert.throws(() => assertDefined(null, "was null"));
  });

  console.log("retry");
  await test("succeeds after transient failures", async () => {
    let attempts = 0;
    const result = await retry(
      async () => {
        attempts++;
        if (attempts < 3) throw new Error("transient");
        return "ok";
      },
      { retries: 5, delayMs: 1 }
    );
    assert.strictEqual(result, "ok");
    assert.strictEqual(attempts, 3);
  });
  await test("throws after exhausting retries", async () => {
    let attempts = 0;
    await assert.rejects(
      retry(
        async () => {
          attempts++;
          throw new Error("always fails");
        },
        { retries: 2, delayMs: 1 }
      )
    );
    assert.strictEqual(attempts, 3); // initial + 2 retries
  });

  console.log("groupBy");
  await test("groups items by key function", () => {
    const grouped = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? "even" : "odd"));
    assert.deepStrictEqual(grouped.even, [2, 4]);
    assert.deepStrictEqual(grouped.odd, [1, 3, 5]);
  });

  console.log(`\n${passed} tests passed.`);
}

main();
