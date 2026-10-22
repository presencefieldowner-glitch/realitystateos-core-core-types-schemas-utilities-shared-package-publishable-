# @realitystateos/entity-model

Typed entities and typed, temporally-scoped relationships between them — the layer Knowledge (005) and Reality Graph (006) build directly on.

**Proprietary — © Joseph Michael Rounsaville. See root `LICENSE.md`.**

## What's here
- `TypedEntity<TType, TAttrs>` — a versioned, attributed entity (extends `BaseObject`).
- `createTypedEntity` / `updateAttributes` — create and version-bump entities.
- `Relationship<TRelType>` — a directed, cardinality-typed edge between two entity IDs.
- `createRelationship` / `endRelationship` / `isRelationshipActive` — relationships are **ended, never deleted** (`validTo` is set), so point-in-time graph queries stay historically accurate. This is the Foundation-level building block for `TemporalGraph` in module 006.

## Cross-module import note
These modules import CoreTypes/ObjectModel from their **compiled `dist/` output**, not `src/`. Each module here is a separate npm package (own `node_modules`), so a relative import of another package's `.ts` source would compile to a `require()` that can't resolve that package's own dependencies (e.g. `ulid`, `@noble/ed25519`) at runtime. Importing the built `dist/` keeps Node's module resolution walking up from the *right* directory.

**Build order matters:** CoreTypes → ObjectModel → EntityModel. Always `npm run build` upstream modules first.

## Build & test
```bash
npm install
npm test    # builds with tsc and runs the self-test suite (6 tests)
```
