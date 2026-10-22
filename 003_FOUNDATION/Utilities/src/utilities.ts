/**
 * RealityStateOS — Foundation / Utilities
 * Small, dependency-free helpers used across every other module.
 */

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object).sort();
    const bk = Object.keys(b as object).sort();
    if (!deepEqual(ak, bk)) return false;
    return ak.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    );
  }
  return false;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}

export interface RetryOptions {
  retries: number;
  delayMs: number;
  backoffFactor?: number; // default 2 (exponential)
  onRetry?: (attempt: number, error: unknown) => void;
}

/** Retries an async operation with exponential backoff. Used by Storage,
 * connectors, and any network-facing module for resilient calls. */
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const factor = opts.backoffFactor ?? 2;
  let lastError: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === opts.retries) break;
      opts.onRetry?.(attempt + 1, e);
      const delay = opts.delayMs * Math.pow(factor, attempt);
      await sleep(delay);
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Groups an array by a key function — common pattern for reporting/aggregation. */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
