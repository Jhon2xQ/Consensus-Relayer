import { describe, it, expect } from "bun:test";
import { SemaphoreController } from "../../../src/presentation/controllers/semaphore.controller";
import { makeContext, makeTestUseCases } from "./helpers";
import { TEST_ADDRESS, TEST_HASH } from "../../application/use-cases/helpers";
import type { TransactionResult } from "../../../src/domain/types/semaphore.types";

const FAKE_RESULT: TransactionResult = {
  hash: TEST_HASH,
  blockNumber: 100n,
  gasUsed: 21_000n,
  status: "success",
};

describe("SemaphoreController.updateGroupAdmin (T25 — UpdateGroupAdminSchema wiring)", () => {
  it("returns 200 with the use-case result on a valid body", async () => {
    const useCases = makeTestUseCases({
      updateGroupAdmin: {
        execute: async (_groupId: bigint, _newAdmin: `0x${string}`) => FAKE_RESULT,
      },
    });
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      jsonBody: { newAdmin: TEST_ADDRESS },
      paramValue: "1",
    });

    await controller.updateGroupAdmin(ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.status).toBe(200);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { groupId: string; newAdmin: string; transaction: TransactionResult };
    };
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Group admin updated");
    expect(payload.data.groupId).toBe("1");
    expect(payload.data.newAdmin).toBe(TEST_ADDRESS);
    expect(payload.data.transaction.status).toBe("success");
    expect(payload.data.transaction.hash).toBe(TEST_HASH);
  });

  it("returns 400 with validation details when newAdmin is missing", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      jsonBody: {},
      paramValue: "1",
    });

    await controller.updateGroupAdmin(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { details: Array<{ field: string; message: string }> };
    };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Validation error");
    expect(payload.data.details.some((d) => d.field === "newAdmin")).toBe(true);
  });

  it("returns 400 with validation details when newAdmin is not a valid address", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      jsonBody: { newAdmin: "not-an-address" },
      paramValue: "1",
    });

    await controller.updateGroupAdmin(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      data: { details: Array<{ field: string }> };
    };
    expect(payload.data.details.some((d) => d.field === "newAdmin")).toBe(true);
  });
});
