# @realitystateos/object-model

The base struct/trait layer every RealityStateOS "thing" extends.

**Proprietary — © Joseph Michael Rounsaville. See root `LICENSE.md`.**

## What's here
- `BaseObject` — id, createdAt, updatedAt, version. Every typed entity extends this.
- `Tombstonable` — soft-delete marker (`deletedAt`). Objects are never hard-deleted — preserves provenance for the Reality Tape / EventStore's tamper-evidence guarantees.
- `Kinded` — runtime-checkable type tag for generic storage/graph code that needs to discriminate object types across module/process boundaries.

Depends on `CoreTypes` (built dist, not source — see EntityModel's README for why).

## Build
```bash
npm install && npm run build
```
