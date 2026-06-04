import { describe, it, expect, beforeEach } from "bun:test";
import { AddMembersUseCase } from "../../../src/application/use-cases/add-members.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("AddMembersUseCase (T15 — status)", () => {
  let blockchain: IBlockchainService;
  let useCase: AddMembersUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new AddMembersUseCase(blockchain);
  });

  it("calls writeContract with addMembers and the correct args (groupId + identityCommitments[])", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AddMembersUseCase(blockchain);

    await useCase.execute({ groupId: 5n, identityCommitments: [1n, 2n, 3n] });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("addMembers");
    expect(captured!.args).toEqual([5n, [1n, 2n, 3n]]);
  });

  it("returns a result with status: 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new AddMembersUseCase(blockchain);

    const result = await useCase.execute({ groupId: 5n, identityCommitments: [1n, 2n] });

    expect(result.status).toBe("success");
    expect(result.hash).toBe(TEST_HASH);
  });

  it("throws when the on-chain receipt status is 'reverted'", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new AddMembersUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 5n, identityCommitments: [1n, 2n] }),
    ).rejects.toThrow();
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AddMembersUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 5n, identityCommitments: [1n] }),
    ).rejects.toThrow("user rejected");
  });
});
