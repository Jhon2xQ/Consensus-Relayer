import { describe, it, expect, beforeEach } from "bun:test";
import { UpdateMemberUseCase } from "../../../src/application/use-cases/update-member.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("UpdateMemberUseCase (T16 — status)", () => {
  let blockchain: IBlockchainService;
  let useCase: UpdateMemberUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new UpdateMemberUseCase(blockchain);
  });

  it("calls writeContract with updateMember and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateMemberUseCase(blockchain);

    await useCase.execute({
      groupId: 7n,
      identityCommitment: 100n,
      newIdentityCommitment: 200n,
      merkleProofSiblings: [1n, 2n, 3n],
    });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("updateMember");
    expect(captured!.args).toEqual([7n, 100n, 200n, [1n, 2n, 3n]]);
  });

  it("returns a result with status: 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new UpdateMemberUseCase(blockchain);

    const result = await useCase.execute({
      groupId: 7n,
      identityCommitment: 100n,
      newIdentityCommitment: 200n,
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
    useCase = new UpdateMemberUseCase(blockchain);

    await expect(
      useCase.execute({
        groupId: 7n,
        identityCommitment: 100n,
        newIdentityCommitment: 200n,
        merkleProofSiblings: [],
      }),
    ).rejects.toThrow();
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateMemberUseCase(blockchain);

    await expect(
      useCase.execute({
        groupId: 7n,
        identityCommitment: 100n,
        newIdentityCommitment: 200n,
        merkleProofSiblings: [],
      }),
    ).rejects.toThrow("user rejected");
  });
});
