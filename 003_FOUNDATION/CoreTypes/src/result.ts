/**
 * RealityStateOS — CoreTypes / Result
 * Rust-style Result<T, E> and Option<T> for explicit, typed error handling
 * across module boundaries — no throwing across the Kernel/module API.
 */

export type Result<T, E = Error> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok;
}

export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return !r.ok;
}

/** Unwrap or throw — use only at edges (CLI, HTTP handlers), never in core logic. */
export function unwrap<T, E>(r: Result<T, E>): T {
  if (isOk(r)) return r.value;
  throw r.error instanceof Error ? r.error : new Error(String(r.error));
}

export function mapResult<T, U, E>(r: Result<T, E>, f: (v: T) => U): Result<U, E> {
  return isOk(r) ? ok(f(r.value)) : r;
}

export type Option<T> = T | undefined;

export function isSome<T>(o: Option<T>): o is T {
  return o !== undefined;
}
