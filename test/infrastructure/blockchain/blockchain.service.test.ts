import { describe, it, expect, beforeEach, spyOn, afterEach } from "bun:test";
import { publicClient, walletClient } from "../../../src/configs/blockchain.config";
import { BlockchainService } from "../../../src/infrastructure/blockchain/blockchain.service";

const ADDR = "0x1234567890123456789012345678901234567890" as `0x${string}`;

describe("BlockchainService.writeContractWithResult", () => {
  let service: BlockchainService;
  let simulateSpy: ReturnType<typeof spyOn>;
  let writeSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    service = new BlockchainService();
    simulateSpy = spyOn(publicClient, "simulateContract");
    writeSpy = spyOn(walletClient, "writeContract");
  });

  afterEach(() => {
    simulateSpy.mockRestore();
    writeSpy.mockRestore();
  });

  it("returns the decoded result from simulateContract together with the tx hash", async () => {
    simulateSpy.mockResolvedValue({
      request: {
        address: ADDR,
        abi: [],
        functionName: "createGroup",
        args: [],
      },
      result: 7n,
    } as any);
    writeSpy.mockResolvedValue("0xfeedface" as `0x${string}`);

    const { hash, result } = await service.writeContractWithResult<bigint>(
      "createGroup",
      [ADDR, BigInt(3600)],
    );

    expect(result).toBe(7n);
    expect(hash).toBe("0xfeedface");
  });

  it("calls simulateContract BEFORE writeContract (pre-flight)", async () => {
    const order: string[] = [];
    simulateSpy.mockImplementation(async () => {
      order.push("simulate");
      return {
        request: { address: ADDR, abi: [], functionName: "createGroup", args: [] },
        result: 1n,
      } as any;
    });
    writeSpy.mockImplementation(async () => {
      order.push("write");
      return "0xabc" as `0x${string}`;
    });

    await service.writeContractWithResult<bigint>("createGroup", [ADDR, BigInt(3600)]);

    expect(order).toEqual(["simulate", "write"]);
  });

  it("propagates the simulation error and does NOT broadcast the transaction", async () => {
    const revertReason = new Error("execution reverted: invalid admin");
    simulateSpy.mockRejectedValue(revertReason);
    writeSpy.mockResolvedValue("0xshould-not-happen" as `0x${string}`);

    await expect(
      service.writeContractWithResult<bigint>("createGroup", [ADDR, BigInt(0)]),
    ).rejects.toThrow("execution reverted: invalid admin");

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("forwards functionName, args, and value to simulateContract", async () => {
    simulateSpy.mockResolvedValue({
      request: { address: ADDR, abi: [], functionName: "createGroup", args: [ADDR, 3600n] },
      result: 99n,
    } as any);
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContractWithResult<bigint>("createGroup", [ADDR, BigInt(3600)], BigInt(1000));

    expect(simulateSpy).toHaveBeenCalledTimes(1);
    const call = simulateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.functionName).toBe("createGroup");
    expect(call.args).toEqual([ADDR, BigInt(3600)]);
    expect(call.value).toBe(BigInt(1000));
    expect(call.address).toBeDefined();
  });

  it("passes gas from GAS_OVERRIDES to simulateContract when no explicit gas is provided (createGroup -> 8M)", async () => {
    simulateSpy.mockResolvedValue({
      request: { address: ADDR, abi: [], functionName: "createGroup", args: [] },
      result: 1n,
    } as any);
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContractWithResult<bigint>("createGroup", []);

    const call = simulateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBe(8_000_000n);
  });

  it("passes gas from GAS_OVERRIDES for MerkleTree-touching functions", async () => {
    simulateSpy.mockResolvedValue({
      request: { address: ADDR, abi: [], functionName: "addMember", args: [] },
      result: 0n,
    } as any);
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContractWithResult<bigint>("addMember", [1n, 2n]);

    const call = simulateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBe(1_500_000n);
  });

  it("uses explicit gas param when provided, ignoring GAS_OVERRIDES", async () => {
    simulateSpy.mockResolvedValue({
      request: { address: ADDR, abi: [], functionName: "createGroup", args: [] },
      result: 1n,
    } as any);
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContractWithResult<bigint>("createGroup", [], BigInt(0), 500_000n);

    const call = simulateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBe(500_000n);
  });

  it("omits gas from simulateContract when no override and no env default", async () => {
    simulateSpy.mockResolvedValue({
      request: { address: ADDR, abi: [], functionName: "updateGroupAdmin", args: [] },
      result: 0n,
    } as any);
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContractWithResult<bigint>("updateGroupAdmin", [1n, ADDR]);

    const call = simulateSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBeUndefined();
  });
});

describe("BlockchainService.writeContract (no simulate)", () => {
  let service: BlockchainService;
  let writeSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    service = new BlockchainService();
    writeSpy = spyOn(walletClient, "writeContract");
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it("passes gas from GAS_OVERRIDES to writeContract for non-simulate flow", async () => {
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContract("addMember", [1n, 2n]);

    const call = writeSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBe(1_500_000n);
  });

  it("omits gas from writeContract when no override applies", async () => {
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContract("updateGroupAdmin", [1n, ADDR]);

    const call = writeSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBeUndefined();
  });

  it("uses explicit gas param when provided, ignoring GAS_OVERRIDES", async () => {
    writeSpy.mockResolvedValue("0xhash" as `0x${string}`);

    await service.writeContract("addMember", [1n, 2n], BigInt(0), 999_999n);

    const call = writeSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call.gas).toBe(999_999n);
  });
});
