/**
 * RealityStateOS — Foundation / EntityModel
 * Typed entities and typed relationships between them (RelationshipModel).
 * This is the layer Knowledge (005) and Reality Graph (006) build directly on.
 */
import { Id, newId } from "../../CoreTypes/dist/id";
import { defaultClock, Rfc3339 } from "../../CoreTypes/dist/timestamp";
import { BaseObject } from "../../ObjectModel/dist/objectModel";

/** A typed entity — the Foundation-level generalization of EntityRecord's payload. */
export interface TypedEntity<TType extends string, TAttrs> extends BaseObject {
  entityType: TType;
  attributes: TAttrs;
  createdBy: Id;
}

export function createTypedEntity<TType extends string, TAttrs>(
  entityType: TType,
  attributes: TAttrs,
  createdBy: Id
): TypedEntity<TType, TAttrs> {
  const now = defaultClock.nowRfc3339();
  return {
    id: newId(),
    entityType,
    attributes,
    createdBy,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export function updateAttributes<TType extends string, TAttrs>(
  entity: TypedEntity<TType, TAttrs>,
  attributes: TAttrs
): TypedEntity<TType, TAttrs> {
  return {
    ...entity,
    attributes,
    version: entity.version + 1,
    updatedAt: defaultClock.nowRfc3339(),
  };
}

/** Cardinality of a relationship, mirrors graph edge semantics used by module 006. */
export type Cardinality = "one-to-one" | "one-to-many" | "many-to-many";

/** A typed, directed relationship between two entities (becomes a graph Edge later). */
export interface Relationship<TRelType extends string> {
  id: Id;
  relType: TRelType;
  fromId: Id;
  toId: Id;
  cardinality: Cardinality;
  createdAt: Rfc3339;
  validFrom: Rfc3339; // temporal scoping — see TemporalGraph (006)
  validTo?: Rfc3339; // undefined = still valid
  attributes?: Record<string, unknown>;
}

export function createRelationship<TRelType extends string>(params: {
  relType: TRelType;
  fromId: Id;
  toId: Id;
  cardinality: Cardinality;
  attributes?: Record<string, unknown>;
}): Relationship<TRelType> {
  const now = defaultClock.nowRfc3339();
  return {
    id: newId(),
    relType: params.relType,
    fromId: params.fromId,
    toId: params.toId,
    cardinality: params.cardinality,
    createdAt: now,
    validFrom: now,
    attributes: params.attributes,
  };
}

/** Ends (invalidates) a relationship as of now — used instead of deleting,
 * so TemporalGraph queries ("what was true at time T") remain accurate. */
export function endRelationship<TRelType extends string>(
  rel: Relationship<TRelType>
): Relationship<TRelType> {
  return { ...rel, validTo: defaultClock.nowRfc3339() };
}

export function isRelationshipActive<TRelType extends string>(
  rel: Relationship<TRelType>,
  atTime?: Date
): boolean {
  const t = (atTime ?? new Date()).toISOString();
  return t >= rel.validFrom && (rel.validTo === undefined || t < rel.validTo);
}
