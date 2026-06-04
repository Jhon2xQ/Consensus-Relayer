import { describe, it, expect, beforeEach } from "bun:test";
import { AddMemberUseCase } from "../../../src/application/use-cases/add-member.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("AddMemberUseCase (T15 — status)", () => {
  let blockchain: IBlockchainService;
  let useCase: AddMemberUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new AddMemberUseCase(blockchain);
  });

  it("calls writeContract with addMember and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AddMemberUseCase(blockchain);

    await useCase.execute({ groupId: 1n, identityCommitment: 999n });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("addMember");
    expect(captured!.args).toEqual([1n, 999n]);
  });

  it("returns a result with status: 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new AddMemberUseCase(blockchain);

    const result = await useCase.execute({ groupId: 1n, identityCommitment: 999n });

    expect(result.status).toBe("success");
    expect(result.hash).toBe(TEST_HASH);
    expect(result.blockNumber).toBe(100n);
    expect(result.gasUsed).toBe(21_000n);
  });

  it("throws when the on-chain receipt status is 'reverted'", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new AddMemberUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 1n, identityCommitment: 999n }),
    ).rejects.toThrow();
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AddMemberUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 1n, identityCommitment: 999n }),
    ).rejects.toThrow("user rejected");
  });
});
