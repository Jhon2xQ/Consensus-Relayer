import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z, ZodError } from "zod";
import { errorHandler } from "./error-handler";
import { DomainException } from "../../domain/exceptions/domain.exception";

type CapturedCall = { data: unknown; status: number };

function makeContext(): { ctx: Context; calls: CapturedCall[] } {
  const calls: CapturedCall[] = [];
  const ctx = {
    json: (data: unknown, status: number) => {
      calls.push({ data, status });
      return { data, status } as unknown as Response;
    },
  } as unknown as Context;
  return { ctx, calls };
}

describe("errorHandler (T10 — Zod 4 migration)", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("formats a ZodError using err.issues (no flatten)", () => {
    const { ctx, calls } = makeContext();

    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
    if (result.success) return;

    const response = errorHandler(result.error as ZodError, ctx) as unknown as Response;

    expect(calls).toHaveLength(1);
    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { details: Array<{ field: string; message: string; code: string }> };
    };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Validation error");
    expect(Array.isArray(payload.data.details)).toBe(true);
    expect(payload.data.details[0]?.field).toBe("name");
    expect(payload.data.details[0]?.message).toBeDefined();
    expect(payload.data.details[0]?.code).toBe("invalid_type");
    expect(response).toBeDefined();
  });

  it("returns multiple issue details when schema has multiple violations", () => {
    const { ctx, calls } = makeContext();
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const result = schema.safeParse({ age: "not-a-number" });
    if (result.success) return;

    errorHandler(result.error as ZodError, ctx);

    const payload = calls[0]?.data as {
      data: { details: Array<{ field: string }> };
    };
    expect(payload.data.details.length).toBeGreaterThanOrEqual(1);
  });

  it("handles DomainException with its own status code", () => {
    const { ctx, calls } = makeContext();
    const err = new DomainException("Group 7 not found", 404);

    errorHandler(err, ctx);

    expect(calls[0]?.status).toBe(404);
    const payload = calls[0]?.data as { success: boolean; message: string };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Group 7 not found");
  });

  it("handles HTTPException with its own status", () => {
    const { ctx, calls } = makeContext();
    const err = new HTTPException(401, { message: "Unauthorized" });

    errorHandler(err, ctx);

    expect(calls[0]?.status).toBe(401);
    const payload = calls[0]?.data as { message: string };
    expect(payload.message).toBe("Unauthorized");
  });

  it("maps a generic Error to 500", () => {
    const { ctx, calls } = makeContext();
    const err = new Error("something exploded");

    errorHandler(err, ctx);

    expect(calls[0]?.status).toBe(500);
    const payload = calls[0]?.data as { success: boolean; message: string };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Internal server error");
  });

  it("does NOT produce a flatten-shaped payload (no fieldErrors/formErrors keys)", () => {
    const { ctx, calls } = makeContext();
    const schema = z.object({ x: z.string() });
    const result = schema.safeParse({ x: 1 });
    if (result.success) return;

    errorHandler(result.error as ZodError, ctx);

    const payload = calls[0]?.data as {
      data: { details: unknown; fieldErrors?: unknown; formErrors?: unknown };
    };
    expect(payload.data.fieldErrors).toBeUndefined();
    expect(payload.data.formErrors).toBeUndefined();
    expect(Array.isArray(payload.data.details)).toBe(true);
  });
});
