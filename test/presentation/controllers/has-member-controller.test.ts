import { describe, it, expect } from "bun:test";
import { SemaphoreController } from "../../../src/presentation/controllers/semaphore.controller";
import { makeContext, makeTestUseCases } from "./helpers";

describe("SemaphoreController.hasMember (T25 — MemberQuerySchema wiring)", () => {
  it("returns 200 with the boolean result on valid query params", async () => {
    const useCases = makeTestUseCases({
      hasMember: {
        execute: async (_groupId: bigint, _identityCommitment: bigint) => true,
      },
    });
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { groupId: "1", identityCommitment: "999" },
    });

    await controller.hasMember(ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.status).toBe(200);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { groupId: string; identityCommitment: string; hasMember: boolean };
    };
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Member check completed");
    expect(payload.data.hasMember).toBe(true);
    expect(payload.data.groupId).toBe("1");
    expect(payload.data.identityCommitment).toBe("999");
  });

  it("returns 200 with hasMember:false when the contract reports no membership", async () => {
    const useCases = makeTestUseCases({
      hasMember: {
        execute: async (_groupId: bigint, _identityCommitment: bigint) => false,
      },
    });
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { groupId: "1", identityCommitment: "999" },
    });

    await controller.hasMember(ctx);

    const payload = calls[0]?.data as { data: { hasMember: boolean } };
    expect(payload.data.hasMember).toBe(false);
  });

  it("returns 400 with validation details when identityCommitment is missing", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { groupId: "1" },
    });

    await controller.hasMember(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { details: Array<{ field: string; message: string; code: string }> };
    };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Validation error");
    expect(Array.isArray(payload.data.details)).toBe(true);
    expect(payload.data.details.length).toBeGreaterThanOrEqual(1);
    expect(payload.data.details[0]?.field).toBe("identityCommitment");
  });

  it("returns 400 with validation details when groupId is not numeric", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { groupId: "abc", identityCommitment: "999" },
    });

    await controller.hasMember(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      data: { details: Array<{ field: string }> };
    };
    expect(payload.data.details.some((d) => d.field === "groupId")).toBe(true);
  });
});
