import { describe, it, expect } from "bun:test";
import { SemaphoreController } from "../../../src/presentation/controllers/semaphore.controller";
import { makeContext, makeTestUseCases } from "./helpers";

describe("SemaphoreController.indexOf (T27)", () => {
  it("returns 200 with the index on a valid query", async () => {
    const useCases = makeTestUseCases({
      indexOf: {
        execute: async (dto: { groupId: bigint; identityCommitment: bigint }) => ({
          groupId: dto.groupId,
          identityCommitment: dto.identityCommitment,
          index: 42n,
        }),
      },
    });
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { groupId: "1", identityCommitment: "999" },
    });

    await controller.indexOf(ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.status).toBe(200);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { groupId: string; identityCommitment: string; index: string };
    };
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Member index retrieved successfully");
    expect(payload.data.groupId).toBe("1");
    expect(payload.data.identityCommitment).toBe("999");
    expect(payload.data.index).toBe("42");
  });

  it("returns 200 with index '0' for the first member", async () => {
    const useCases = makeTestUseCases({
      indexOf: {
        execute: async (dto: { groupId: bigint; identityCommitment: bigint }) => ({
          groupId: dto.groupId,
          identityCommitment: dto.identityCommitment,
          index: 0n,
        }),
      },
    });
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { groupId: "5", identityCommitment: "123" },
    });

    await controller.indexOf(ctx);

    const payload = calls[0]?.data as { data: { index: string } };
    expect(payload.data.index).toBe("0");
  });

  it("returns 400 with validation details when groupId is missing", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      query: { identityCommitment: "999" },
    });

    await controller.indexOf(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { details: Array<{ field: string }> };
    };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Validation error");
    expect(payload.data.details.some((d) => d.field === "groupId")).toBe(true);
  });
});
