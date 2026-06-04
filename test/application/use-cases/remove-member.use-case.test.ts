import { describe, it, expect, beforeEach } from "bun:test";
import { RemoveMemberUseCase } from "../../../src/application/use-cases/remove-member.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("RemoveMemberUseCase (T16 — status)", () => {
  let blockchain: IBlockchainService;
  let useCase: RemoveMemberUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new RemoveMemberUseCase(blockchain);
  });

  it("calls writeContract with removeMember and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new RemoveMemberUseCase(blockchain);

    await useCase.execute({
      groupId: 7n,
      identityCommitment: 999n,
      merkleProofSiblings: [11n, 22n, 33n],
    });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("removeMember");
    expect(captured!.args).toEqual([7n, 999n, [11n, 22n, 33n]]);
  });

  it("returns a result with status: 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new RemoveMemberUseCase(blockchain);

    const result = await useCase.execute({
      groupId: 7n,
      identityCommitment: 999n,
      merkleProofSiblings: [],
    });

    expect(result.status).toBe("success");
    expect(result.hash).toBe(TEST_HASH);
  });

  it("throws when the on-chain receipt status is 'reverted'", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new RemoveMemberUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 7n, identityCommitment: 999n, merkleProofSiblings: [] }),
    ).rejects.toThrow();
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new RemoveMemberUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 7n, identityCommitment: 999n, merkleProofSiblings: [] }),
    ).rejects.toThrow("user rejected");
  });
});
