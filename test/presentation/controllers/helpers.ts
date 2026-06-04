import type { Context } from "hono";
import type { SemaphoreUseCases } from "../../../src/application/use-cases";

type CapturedCall = { data: unknown; status: number };

/**
 * Build a minimal Hono Context stub for controller tests.
 *
 * It supports the methods that `SemaphoreController` actually uses:
 * - `req.json()` → returns the supplied body
 * - `req.query()` → returns the supplied query
 * - `req.param(name)` → returns the supplied value (same for any name)
 * - `json(data, status)` → captures the response
 */
export function makeContext(options: {
  jsonBody?: unknown;
  query?: Record<string, string | undefined>;
  paramValue?: string;
} = {}): { ctx: Context; calls: CapturedCall[] } {
  const calls: CapturedCall[] = [];
  const ctx = {
    req: {
      json: async () => options.jsonBody,
      query: () => options.query ?? {},
      param: (_name: string) => options.paramValue,
    },
    json: (data: unknown, status: number = 200) => {
      calls.push({ data, status });
      return { data, status } as unknown as Response;
    },
  } as unknown as Context;
  return { ctx, calls };
}

/**
 * Build a `SemaphoreUseCases`-shaped stub. Each property is a function that
 * throws when called, except those overridden via `overrides`. We type the
 * overrides loosely and cast on the way out — the controller is structurally
 * tested, so we never care about the use-case's internal type identity.
 */
export function makeTestUseCases(
  overrides: Record<string, unknown> = {},
): SemaphoreUseCases {
  const noop = () => {
    throw new Error("use-case not stubbed in this test");
  };
  const base: Record<string, unknown> = {
    createGroup: { execute: noop },
    addMember: { execute: noop },
    addMembers: { execute: noop },
    removeMember: { execute: noop },
    updateMember: { execute: noop },
    acceptGroupAdmin: { execute: noop },
    updateGroupAdmin: { execute: noop },
    updateGroupMerkleTreeDuration: { execute: noop },
    validateProof: { execute: noop },
    verifyProof: { execute: noop },
    getGroupInfo: { execute: noop },
    getGroupCounter: { execute: noop },
    getVerifier: { execute: noop },
    hasMember: { execute: noop },
    indexOf: { execute: noop },
  };
  return { ...base, ...overrides } as unknown as SemaphoreUseCases;
}
