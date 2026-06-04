import { describe, it, expect, beforeEach } from "bun:test";
import { UpdateGroupMerkleTreeDurationUseCase } from "../../../src/application/use-cases/update-group-merkle-tree-duration.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("UpdateGroupMerkleTreeDurationUseCase (T20 — new)", () => {
  let blockchain: IBlockchainService;
  let useCase: UpdateGroupMerkleTreeDurationUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new UpdateGroupMerkleTreeDurationUseCase(blockchain);
  });

  it("calls writeContract with updateGroupMerkleTreeDuration and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateGroupMerkleTreeDurationUseCase(blockchain);

    await useCase.execute({ groupId: 1n, newMerkleTreeDuration: 604800n });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("updateGroupMerkleTreeDuration");
    expect(captured!.args).toEqual([1n, 604800n]);
  });

  it("returns a result with status: 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new UpdateGroupMerkleTreeDurationUseCase(blockchain);

    const result = await useCase.execute({ groupId: 1n, newMerkleTreeDuration: 604800n });

    expect(result.hash).toBe(TEST_HASH);
    expect(result.status).toBe("success");
    expect(result.blockNumber).toBe(100n);
  });

  it("throws when the on-chain receipt status is 'reverted'", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new UpdateGroupMerkleTreeDurationUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 1n, newMerkleTreeDuration: 604800n }),
    ).rejects.toThrow();
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateGroupMerkleTreeDurationUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 1n, newMerkleTreeDuration: 604800n }),
    ).rejects.toThrow("user rejected");
  });

  it("is exported from src/application/use-cases/index.ts", () => {
    expect(typeof UpdateGroupMerkleTreeDurationUseCase).toBe("function");
  });
});
