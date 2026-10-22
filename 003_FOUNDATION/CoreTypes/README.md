# @realitystateos/core-types

Foundation-layer primitives for RealityStateOS. Implements RFC-0002 (`000_ARCHITECTURE/Specifications/formats.md`).

**Proprietary — © Joseph Michael Rounsaville. See root `LICENSE.md`.**

## What's here
- `id.ts` — ULID-based `Id` type, generation, and validation.
- `timestamp.ts` — RFC3339/UTC timestamps, `SystemClock` + `FixedClock` for deterministic replay/testing.
- `result.ts` — `Result<T,E>` / `Option<T>` for explicit error handling across module boundaries.
- `crypto.ts` — Ed25519 sign/verify, BLAKE3 hashing (via `@noble/*`, pure-JS, audited libraries).
- `entityRecord.ts` — the canonical `EntityRecord` envelope (id, version, payload, signature).
- `event.ts` — the hash-chained, signed `Event` envelope used by the future Verified Bus (module 004), including `verifyChain()` for tamper-evidence.

## Usage

```bash
npm install
npm test    # builds with tsc and runs the self-test suite (15 tests)
npm run build
```

```ts
import { newId, generateKeyPair, createEntityRecord, signEntityRecord, verifyEntityRecord } from "./dist";

const kp = generateKeyPair();
const record = signEntityRecord(
  createEntityRecord({ entityType: "user_profile", payload: { displayName: "Joseph" }, createdBy: newId() }),
  kp
);
verifyEntityRecord(record, kp.publicKey); // true
```

## Known deviations from spec (tracked, not forgotten)
- **Wire format:** spec calls for canonical Protobuf encoding of the signable bytes. Current implementation uses deterministic JSON encoding as a placeholder — swap in generated Protobuf codecs before this leaves prototype status.
- **Language:** written in TypeScript/Node for fast iteration and real test execution in this environment. The Kernel (module 002) is a stronger candidate for Rust given its systems-level process/memory management needs — this module's logic can be ported once that decision is finalized.

## Next up
`003_FOUNDATION/ObjectModel` and `EntityModel` — the base struct/trait layer and typed relationships that build on `EntityRecord` here.
