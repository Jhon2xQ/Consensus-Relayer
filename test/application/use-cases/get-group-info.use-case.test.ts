import { describe, it, expect, beforeEach } from "bun:test";
import { GetGroupInfoUseCase } from "../../../src/application/use-cases/get-group-info.use-case";
import { makeTestBlockchain, TEST_ADDRESS } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";
import { SemaphoreException } from "../../../src/domain/exceptions/semaphore.exception";

const ADMIN = TEST_ADDRESS;

describe("GetGroupInfoUseCase (T18 — granular error handling)", () => {
  let useCase: GetGroupInfoUseCase;

  beforeEach(() => {
    useCase = new GetGroupInfoUseCase(makeTestBlockchain());
  });

  it("returns all 5 fields when the group exists and every read succeeds", async () => {
    useCase = new GetGroupInfoUseCase(
      makeTestBlockchain({
        readContract: (async (functionName: string) => {
          if (functionName === "getGroupAdmin") return ADMIN;
          if (functionName === "getMerkleTreeDepth") return 20n;
          if (functionName === "getMerkleTreeRoot") return 123n;
          if (functionName === "getMerkleTreeSize") return 5n;
          if (functionName === "groups") return 3600n;
          return undefined;
        }) as IBlockchainService["readContract"],
      }),
    );

    const info = await useCase.execute(1n);

    expect(info.id).toBe(1n);
    expect(info.admin).toBe(ADMIN);
    expect(info.merkleTreeDuration).toBe(3600n);
    expect(info.merkleTreeDepth).toBe(20n);
    expect(info.merkleTreeRoot).toBe(123n);
    expect(info.merkleTreeSize).toBe(5n);
  });

  it("throws NotFoundException (SemaphoreException.groupNotFound) when getGroupAdmin fails", async () => {
    useCase = new GetGroupInfoUseCase(
      makeTestBlockchain({
        readContract: (async (functionName: string) => {
          if (functionName === "getGroupAdmin") {
            throw new Error("execution reverted: group does not exist");
          }
          return undefined;
        }) as IBlockchainService["readContract"],
      }),
    );

    let caught: unknown;
    try {
      await useCase.execute(99n);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(SemaphoreException);
    expect((caught as SemaphoreException).statusCode).toBe(404);
    expect((caught as SemaphoreException).message).toContain("99");
  });

  it("returns null for a single failed non-admin read while returning the rest of the fields", async () => {
    useCase = new GetGroupInfoUseCase(
      makeTestBlockchain({
        readContract: (async (functionName: string) => {
          if (functionName === "getGroupAdmin") return ADMIN;
          if (functionName === "getMerkleTreeDepth") return 20n;
          if (functionName === "getMerkleTreeRoot") {
            throw new Error("RPC timeout on root read");
          }
          if (functionName === "getMerkleTreeSize") return 5n;
          if (functionName === "groups") return 3600n;
          return undefined;
        }) as IBlockchainService["readContract"],
      }),
    );

    const info = await useCase.execute(1n);

    expect(info.admin).toBe(ADMIN);
    expect(info.merkleTreeDepth).toBe(20n);
    expect(info.merkleTreeRoot).toBeNull();
    expect(info.merkleTreeSize).toBe(5n);
    expect(info.merkleTreeDuration).toBe(3600n);
  });

  it("returns null for every failed non-admin read while still returning the admin", async () => {
    useCase = new GetGroupInfoUseCase(
      makeTestBlockchain({
        readContract: (async (functionName: string) => {
          if (functionName === "getGroupAdmin") return ADMIN;
          throw new Error(`${functionName} failed`);
        }) as IBlockchainService["readContract"],
      }),
    );

    const info = await useCase.execute(1n);

    expect(info.admin).toBe(ADMIN);
    expect(info.merkleTreeDepth).toBeNull();
    expect(info.merkleTreeRoot).toBeNull();
    expect(info.merkleTreeSize).toBeNull();
    expect(info.merkleTreeDuration).toBeNull();
  });
});
