import { describe, it, expect, beforeEach } from "bun:test";
import { HasMemberUseCase } from "../../../src/application/use-cases/has-member.use-case";
import { makeTestBlockchain, TEST_ADDRESS } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("HasMemberUseCase (T17)", () => {
  let blockchain: IBlockchainService;
  let useCase: HasMemberUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new HasMemberUseCase(blockchain);
  });

  it("calls readContract with hasMember and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string, args?: unknown[]) => {
        captured = { functionName, args: args ?? [] };
        return true;
      }) as IBlockchainService["readContract"],
    });
    useCase = new HasMemberUseCase(blockchain);

    await useCase.execute(1n, 999n);

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("hasMember");
    expect(captured!.args).toEqual([1n, 999n]);
  });

  it("returns true when the contract reports the member is in the group", async () => {
    blockchain = makeTestBlockchain({
      readContract: (async () => true) as IBlockchainService["readContract"],
    });
    useCase = new HasMemberUseCase(blockchain);

    const result = await useCase.execute(1n, 999n);

    expect(result).toBe(true);
  });

  it("returns false when the contract reports the member is NOT in the group", async () => {
    blockchain = makeTestBlockchain({
      readContract: (async () => false) as IBlockchainService["readContract"],
    });
    useCase = new HasMemberUseCase(blockchain);

    const result = await useCase.execute(1n, 999n);

    expect(result).toBe(false);
  });

  it("propagates errors from readContract", async () => {
    blockchain = makeTestBlockchain({
      readContract: (async () => {
        throw new Error("RPC error");
      }) as IBlockchainService["readContract"],
    });
    useCase = new HasMemberUseCase(blockchain);

    await expect(useCase.execute(1n, 999n)).rejects.toThrow("RPC error");
  });

  // Suppress unused import warning (TEST_ADDRESS is used in the helper, not here)
  void TEST_ADDRESS;
});
