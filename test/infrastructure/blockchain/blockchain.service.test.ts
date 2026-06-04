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
});
