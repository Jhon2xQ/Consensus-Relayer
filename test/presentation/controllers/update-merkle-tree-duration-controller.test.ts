import { describe, it, expect } from "bun:test";
import { SemaphoreController } from "../../../src/presentation/controllers/semaphore.controller";
import { makeContext, makeTestUseCases } from "./helpers";
import { TEST_HASH } from "../../application/use-cases/helpers";
import type { TransactionResult } from "../../../src/domain/types/semaphore.types";

const FAKE_RESULT: TransactionResult = {
  hash: TEST_HASH,
  blockNumber: 100n,
  gasUsed: 21_000n,
  status: "success",
};

describe("SemaphoreController.updateGroupMerkleTreeDuration (T26)", () => {
  it("returns 200 with the use-case result on a valid body", async () => {
    const useCases = makeTestUseCases({
      updateGroupMerkleTreeDuration: {
        execute: async (_dto: { groupId: bigint; newMerkleTreeDuration: bigint }) => FAKE_RESULT,
      },
    });
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      jsonBody: { newMerkleTreeDuration: "604800" },
      paramValue: "1",
    });

    await controller.updateGroupMerkleTreeDuration(ctx);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.status).toBe(200);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { groupId: string; newMerkleTreeDuration: string; transaction: TransactionResult };
    };
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Group merkle tree duration updated");
    expect(payload.data.groupId).toBe("1");
    expect(payload.data.newMerkleTreeDuration).toBe("604800");
    expect(payload.data.transaction.status).toBe("success");
    expect(payload.data.transaction.hash).toBe(TEST_HASH);
  });

  it("returns 400 with validation details when newMerkleTreeDuration is missing", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      jsonBody: {},
      paramValue: "1",
    });

    await controller.updateGroupMerkleTreeDuration(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      success: boolean;
      message: string;
      data: { details: Array<{ field: string }> };
    };
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Validation error");
    expect(payload.data.details.some((d) => d.field === "newMerkleTreeDuration")).toBe(true);
  });

  it("returns 400 with validation details when newMerkleTreeDuration is not numeric", async () => {
    const useCases = makeTestUseCases();
    const controller = new SemaphoreController(useCases);

    const { ctx, calls } = makeContext({
      jsonBody: { newMerkleTreeDuration: "not-a-number" },
      paramValue: "1",
    });

    await controller.updateGroupMerkleTreeDuration(ctx);

    expect(calls[0]?.status).toBe(400);
    const payload = calls[0]?.data as {
      data: { details: Array<{ field: string }> };
    };
    expect(payload.data.details.some((d) => d.field === "newMerkleTreeDuration")).toBe(true);
  });
});
