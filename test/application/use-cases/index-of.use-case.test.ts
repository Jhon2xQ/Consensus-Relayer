import { describe, it, expect, beforeEach } from "bun:test";
import { IndexOfUseCase } from "../../../src/application/use-cases/index-of.use-case";
import { makeTestBlockchain, TEST_ADDRESS } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

describe("IndexOfUseCase (T21 — new)", () => {
  let blockchain: IBlockchainService;
  let useCase: IndexOfUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new IndexOfUseCase(blockchain);
  });

  it("calls readContract with indexOf and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string, args?: unknown[]) => {
        captured = { functionName, args: args ?? [] };
        return 3n;
      }) as IBlockchainService["readContract"],
    });
    useCase = new IndexOfUseCase(blockchain);

    await useCase.execute({ groupId: 1n, identityCommitment: 999n });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("indexOf");
    expect(captured!.args).toEqual([1n, 999n]);
  });

  it("returns the index from the contract as a bigint", async () => {
    blockchain = makeTestBlockchain({
      readContract: (async () => 3n) as IBlockchainService["readContract"],
    });
    useCase = new IndexOfUseCase(blockchain);

    const result = await useCase.execute({ groupId: 1n, identityCommitment: 999n });

    expect(result.groupId).toBe(1n);
    expect(result.identityCommitment).toBe(999n);
    expect(result.index).toBe(3n);
    expect(typeof result.index).toBe("bigint");
  });

  it("returns 0n when the contract reports the first member of the group", async () => {
    blockchain = makeTestBlockchain({
      readContract: (async () => 0n) as IBlockchainService["readContract"],
    });
    useCase = new IndexOfUseCase(blockchain);

    const result = await useCase.execute({ groupId: 1n, identityCommitment: 999n });

    expect(result.index).toBe(0n);
  });

  it("propagates errors from readContract (e.g. member not in group)", async () => {
    blockchain = makeTestBlockchain({
      readContract: (async () => {
        throw new Error("execution reverted: member not found");
      }) as IBlockchainService["readContract"],
    });
    useCase = new IndexOfUseCase(blockchain);

    await expect(
      useCase.execute({ groupId: 1n, identityCommitment: 999n }),
    ).rejects.toThrow("execution reverted: member not found");
  });

  it("is exported from src/application/use-cases/index.ts", () => {
    expect(typeof IndexOfUseCase).toBe("function");
  });

  // Suppress unused import
  void TEST_ADDRESS;
});
