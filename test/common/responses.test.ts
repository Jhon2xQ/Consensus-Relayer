import { describe, it, expect } from "bun:test";
import { ok, fail, notFound, type ApiResponse } from "../../src/common/responses";

describe("ApiResponse envelope", () => {
  describe("ok()", () => {
    it("returns success envelope with the provided data and message", () => {
      const env = ok<{ id: number }>("User created", { id: 42 });

      expect(env.success).toBe(true);
      expect(env.message).toBe("User created");
      expect(env.data).toEqual({ id: 42 });
    });

    it("uses a numeric timestamp (ms since epoch)", () => {
      const before = Date.now();
      const env = ok("ok", null);
      const after = Date.now();

      expect(typeof env.timestamp).toBe("number");
      expect(env.timestamp).toBeGreaterThanOrEqual(before);
      expect(env.timestamp).toBeLessThanOrEqual(after);
    });

    it("preserves the data type generic (typed return)", () => {
      const env: ApiResponse<bigint> = ok("bigint payload", 123n);

      expect(typeof env.data).toBe("bigint");
      expect(env.data).toBe(123n);
    });
  });

  describe("fail()", () => {
    it("returns failure envelope with success=false and the provided message", () => {
      const env = fail("Something went wrong");

      expect(env.success).toBe(false);
      expect(env.message).toBe("Something went wrong");
    });

    it("defaults data to null when not provided", () => {
      const env = fail("oops");

      expect(env.data).toBeNull();
    });

    it("carries the optional data payload (e.g. validation details)", () => {
      const details = { field: "newAdmin", reason: "invalid checksum" };
      const env = fail("Invalid body", details);

      expect(env.data).toEqual(details);
    });

    it("includes a numeric timestamp", () => {
      const env = fail("nope");

      expect(typeof env.timestamp).toBe("number");
    });
  });

  describe("notFound()", () => {
    it("defaults message to 'Not Found' and success=false", () => {
      const env = notFound();

      expect(env.success).toBe(false);
      expect(env.message).toBe("Not Found");
    });

    it("accepts a custom message", () => {
      const env = notFound("Group 7 does not exist");

      expect(env.message).toBe("Group 7 does not exist");
      expect(env.success).toBe(false);
    });
  });
});
