import { describe, it, expect, beforeEach } from "bun:test";
import { ValidateProofUseCase } from "../../../src/application/use-cases/validate-proof.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_HASH, TEST_ADDRESS } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";
import type { IRecordRelayService } from "../../../src/domain/interfaces/record-relay.interface";
import type { SemaphoreProof } from "../../../src/domain/types/semaphore.types";

function makeProof(): SemaphoreProof {
  return {
    merkleTreeDepth: 20n,
    merkleTreeRoot: 1n,
    nullifier: 123n,
    message: 456n,
    scope: 789n,
    points: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
  };
}

function makeRecordRelay(): IRecordRelayService & { sent: unknown[] } {
  const sent: unknown[] = [];
  return {
    sent,
    send: async (record) => {
      sent.push(record);
    },
  };
}

describe("ValidateProofUseCase (T19 — response shape)", () => {
  let blockchain: IBlockchainService;
  let recordRelay: ReturnType<typeof makeRecordRelay>;
  let useCase: ValidateProofUseCase;

  beforeEach(() => {
    blockchain = makeTestBlockchain();
    recordRelay = makeRecordRelay();
    useCase = new ValidateProofUseCase(blockchain, recordRelay);
  });

  it("calls writeContract with validateProof and the correct args", async () => {
    let captured: { functionName: string; args: unknown[] } | null = null;
    blockchain = makeTestBlockchain({
      writeContract: (async (functionName: string, args: unknown[]) => {
        captured = { functionName, args };
        return TEST_HASH;
      }) as IBlockchainService["writeContract"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(captured).not.toBeNull();
    expect(captured!.functionName).toBe("validateProof");
    expect(captured!.args).toEqual([1n, makeProof()]);
  });

  it("returns a result with hash and status: 'success' on a successful transaction", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    const result = await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(result.hash).toBe(TEST_HASH);
    expect(result.status).toBe("success");
    expect(result.blockNumber).toBe(100n);
    expect(result.gasUsed).toBe(21_000n);
  });

  it("returns status: 'reverted' (no throw) so the controller can include it in the response", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    const result = await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(result.status).toBe("reverted");
  });

  it("relays the validated record when the receipt is successful", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    await useCase.execute({ groupId: 1n, proof: makeProof() });

    // recordRelay.send is async but fire-and-forget — wait a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(recordRelay.sent).toHaveLength(1);
    const record = recordRelay.sent[0] as Record<string, unknown>;
    expect(record.groupId).toBe("1");
    expect(record.nullifier).toBe("123");
    expect(record.message).toBe("456");
    expect(record.scope).toBe("789");
    expect(record.transactionHash).toBe(TEST_HASH);
  });

  it("does NOT relay the record when the receipt is reverted", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted")) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    await useCase.execute({ groupId: 1n, proof: makeProof() });

    await new Promise((r) => setTimeout(r, 0));

    expect(recordRelay.sent).toHaveLength(0);
  });

  it("propagates errors from writeContract", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => {
        throw new Error("user rejected");
      }) as IBlockchainService["writeContract"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    await expect(
      useCase.execute({ groupId: 1n, proof: makeProof() }),
    ).rejects.toThrow("user rejected");
  });

  // Suppress unused import
  void TEST_ADDRESS;
});
