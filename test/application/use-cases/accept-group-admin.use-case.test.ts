import { describe, it, expect, beforeEach } from "bun:test";
import { AcceptGroupAdminUseCase } from "../../../src/application/use-cases/accept-group-admin.use-case";
import { makeTestBlockchain, TEST_ADDRESS, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";
import { BadRequestException } from "../../../src/domain/exceptions/bad-request.exception";

const RELAYER = TEST_ADDRESS;
const PENDING = RELAYER;
const NOT_PENDING = "0x9999999999999999999999999999999999999999" as `0x${string}`;

describe("AcceptGroupAdminUseCase (T13 — pendingAdmin pre-check)", () => {
  let blockchain: IBlockchainService;
  let useCase: AcceptGroupAdminUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    useCase = new AcceptGroupAdminUseCase(blockchain);
  });

  it("executes acceptGroupAdmin when the relayer's address matches the pending admin", async () => {
    let writeCalls: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string) => {
        if (functionName === "getGroupAdmin") return PENDING;
        return undefined;
      }) as IBlockchainService["readContract"],
      getAccountAddress: () => RELAYER,
      writeContract: (async (functionName: string, args: unknown[]) => {
        writeCalls = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AcceptGroupAdminUseCase(blockchain);

    await useCase.execute(1n);

    expect(writeCalls).not.toBeNull();
    expect(writeCalls!.functionName).toBe("acceptGroupAdmin");
    expect(writeCalls!.args).toEqual([1n]);
  });

  it("does NOT call writeContract and throws BadRequestException when the relayer is not the pending admin", async () => {
    let writeCalled = false;
    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string) => {
        if (functionName === "getGroupAdmin") return NOT_PENDING;
        return undefined;
      }) as IBlockchainService["readContract"],
      getAccountAddress: () => RELAYER,
      writeContract: (async () => {
        writeCalled = true;
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AcceptGroupAdminUseCase(blockchain);

    let caught: unknown;
    try {
      await useCase.execute(1n);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).message).toBe("Caller is not the pending admin");
    expect((caught as BadRequestException).statusCode).toBe(400);
    expect(writeCalled).toBe(false);
  });

  it("reads getGroupAdmin with the correct groupId before broadcasting", async () => {
    let readArgs: unknown[] = [];
    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string, args?: unknown[]) => {
        if (functionName === "getGroupAdmin") {
          readArgs = args ?? [];
          return PENDING;
        }
        return undefined;
      }) as IBlockchainService["readContract"],
      getAccountAddress: () => RELAYER,
    });
    useCase = new AcceptGroupAdminUseCase(blockchain);

    await useCase.execute(42n);

    expect(readArgs).toEqual([42n]);
  });

  it("propagates the error when getGroupAdmin fails (no write is attempted)", async () => {
    let writeCalled = false;
    blockchain = makeTestBlockchain({
      readContract: (async () => {
        throw new Error("RPC unavailable");
      }) as IBlockchainService["readContract"],
      getAccountAddress: () => RELAYER,
      writeContract: (async () => {
        writeCalled = true;
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new AcceptGroupAdminUseCase(blockchain);

    await expect(useCase.execute(1n)).rejects.toThrow("RPC unavailable");
    expect(writeCalled).toBe(false);
  });

  it("treats addresses case-insensitively when comparing relayer vs pending admin", async () => {
    const mixedCaseRelayer = "0xabcdefABCDEFabcdefABCDEFabcdefABCDEF0001" as `0x${string}`;
    const mixedCasePending = "0xABCDEFabcdefABCDEFabcdefABCDEFabcdef0001" as `0x${string}`;

    blockchain = makeTestBlockchain({
      readContract: (async (functionName: string) => {
        if (functionName === "getGroupAdmin") return mixedCasePending;
        return undefined;
      }) as IBlockchainService["readContract"],
      getAccountAddress: () => mixedCaseRelayer,
    });
    useCase = new AcceptGroupAdminUseCase(blockchain);

    await expect(useCase.execute(1n)).resolves.toBeDefined();
  });
});
