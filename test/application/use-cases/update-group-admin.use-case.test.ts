import { describe, it, expect, beforeEach } from "bun:test";
import { UpdateGroupAdminUseCase } from "../../../src/application/use-cases/update-group-admin.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH, TEST_ADDRESS } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

const NEW_ADMIN = TEST_ADDRESS;

describe("UpdateGroupAdminUseCase (T14)", () => {
  let blockchain: IBlockchainService;
  let useCase: UpdateGroupAdminUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new UpdateGroupAdminUseCase(blockchain);
  });

  it("calls writeContract with updateGroupAdmin and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateGroupAdminUseCase(blockchain);

    await useCase.execute(7n, NEW_ADMIN);

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("updateGroupAdmin");
    expect(captured!.args).toEqual([7n, NEW_ADMIN]);
  });

  it("preserves the newAdmin address exactly as provided (EIP-55 checksummed)", async () => {
    const checksummed = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as `0x${string}`;
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateGroupAdminUseCase(blockchain);

    await useCase.execute(1n, checksummed);

    expect(captured!.args[1]).toBe(checksummed);
  });

  it("returns the transaction result with status: 'success' on a successful tx", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new UpdateGroupAdminUseCase(blockchain);

    const result = await useCase.execute(1n, NEW_ADMIN);

    expect(result.status).toBe("success");
    expect(result.hash).toBe(TEST_HASH);
    expect(result.blockNumber).toBe(100n);
  });

  it("returns status: 'reverted' when the on-chain receipt is reverted (caller decides what to do)", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new UpdateGroupAdminUseCase(blockchain);

    const result = await useCase.execute(1n, NEW_ADMIN);

    expect(result.status).toBe("reverted");
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected transaction");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new UpdateGroupAdminUseCase(blockchain);

    await expect(useCase.execute(1n, NEW_ADMIN)).rejects.toThrow("user rejected transaction");
  });

  it("propagates errors from waitForTransaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => {
        throw new Error("RPC timeout");
      }) as IBlockchainService["waitForTransaction"],
    });
    useCase = new UpdateGroupAdminUseCase(blockchain);

    await expect(useCase.execute(1n, NEW_ADMIN)).rejects.toThrow("RPC timeout");
  });
});
