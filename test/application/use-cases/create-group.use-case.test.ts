import { describe, it, expect, beforeEach } from "bun:test";
import { CreateGroupUseCase } from "../../../src/application/use-cases/create-group.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH, TEST_ADDRESS } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

const ADMIN = TEST_ADDRESS;

describe("CreateGroupUseCase (T12 — CRIT-01 fix)", () => {
  let blockchain: IBlockchainService;
  let useCase: CreateGroupUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new CreateGroupUseCase(blockchain);
  });

  it("calls writeContractWithResult with admin and merkleTreeDuration when both are provided", async () => {
    let captured: { functionName: string; args: unknown[]; value?: bigint } | null = null;
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>(
        functionName: string,
        args: unknown[],
        value?: bigint,
      ) => {
        captured = { functionName, args, value };
        return { hash: TEST_HASH, result: 42n as T };
      }) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    await useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("createGroup");
    expect(captured!.args).toEqual([ADMIN, 3600n]);
  });

  it("calls writeContractWithResult with only admin when merkleTreeDuration is omitted", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>(functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return { hash: TEST_HASH, result: 7n as T };
      }) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    await useCase.execute({ admin: ADMIN });

    expect(captured!.functionName).toBe("createGroup");
    expect(captured!.args).toEqual([ADMIN]);
  });

  it("calls writeContractWithResult with no args when neither admin nor duration are provided", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>(functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return { hash: TEST_HASH, result: 99n as T };
      }) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    await useCase.execute({});

    expect(captured!.functionName).toBe("createGroup");
    expect(captured!.args).toEqual([]);
  });

  it("uses the decoded result as the groupId, NOT a readContract('groupCounter') call (CRIT-01)", async () => {
    let readContractCalls: string[] = [];
    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string) => {
        readContractCalls.push(functionName);
        return undefined;
      }) as IBlockchainService["readContract"],
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 17n as T })) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n });

    expect(result.groupId).toBe(17n);
    expect(readContractCalls).not.toContain("groupCounter");
  });

  it("returns result.status as 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 1n as T })) as IBlockchainService["writeContractWithResult"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n });

    expect(result.result.status).toBe("success");
    expect(result.result.hash).toBe(TEST_HASH);
  });

  it("propagates the error from writeContractWithResult (simulation or broadcast failure)", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async () => {
        throw new Error("execution reverted: invalid admin");
      }) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    await expect(
      useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n }),
    ).rejects.toThrow("execution reverted: invalid admin");
  });

  it("returns a groupId typed as bigint", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 12345n as T })) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n });

    expect(typeof result.groupId).toBe("bigint");
    expect(result.groupId).toBe(12345n);
  });

  it("resolves admin to dto.admin when provided (T38)", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 1n as T })) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n });

    expect(result.admin).toBe(ADMIN);
  });

  it("resolves admin to the wallet address when dto.admin is omitted (T38)", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 1n as T })) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({ merkleTreeDuration: 3600n });

    expect(result.admin).toBe(TEST_ADDRESS);
  });

  it("returns merkleTreeDuration as-is when provided (T38)", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 1n as T })) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({ admin: ADMIN, merkleTreeDuration: 3600n });

    expect(result.merkleTreeDuration).toBe(3600n);
  });

  it("returns merkleTreeDuration as null when omitted (CRIT-04 / T38)", async () => {
    blockchain = makeTestBlockchain({
      writeContractWithResult: (async <T = unknown>() => ({ hash: TEST_HASH, result: 1n as T })) as IBlockchainService["writeContractWithResult"],
    });
    useCase = new CreateGroupUseCase(blockchain);

    const result = await useCase.execute({});

    expect(result.merkleTreeDuration).toBeNull();
  });
});
