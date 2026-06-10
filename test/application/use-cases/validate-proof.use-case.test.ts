import { describe, it, expect, beforeEach } from "bun:test";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { semaphoreAbi } from "../../../src/configs/semaphore.abi";
import type { Log } from "viem";
import { ValidateProofUseCase } from "../../../src/application/use-cases/validate-proof.use-case";
import { makeTestBlockchain, makeTestReceipt, TEST_ADDRESS, TEST_HASH } from "./helpers";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";
import type { IRecordRelayService } from "../../../src/domain/interfaces/record-relay.interface";
import type { ProofValidatedEventArgs, SemaphoreProof } from "../../../src/domain/types/semaphore.types";

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

function makeProofValidatedEvent(): ProofValidatedEventArgs {
  return {
    groupId: 10n,
    merkleTreeDepth: 20n,
    merkleTreeRoot: 2n,
    nullifier: 321n,
    message: 654n,
    scope: 987n,
    points: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n],
  };
}

function makeProofValidatedLog(eventArgs: ProofValidatedEventArgs): Log {
  const topics = encodeEventTopics({
    abi: semaphoreAbi,
    eventName: "ProofValidated",
    args: [eventArgs.groupId, eventArgs.merkleTreeRoot, eventArgs.scope],
  });
  const data = encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256[8]" },
    ],
    [eventArgs.merkleTreeDepth, eventArgs.nullifier, eventArgs.message, eventArgs.points],
  );

  return {
    address: TEST_ADDRESS,
    blockHash: "0x" + "b".repeat(64) as `0x${string}`,
    blockNumber: 100n,
    data,
    logIndex: 0,
    removed: false,
    topics,
    transactionHash: TEST_HASH,
    transactionIndex: 0,
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
      waitForTransaction: (async () => makeTestReceipt("success", [])) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    const result = await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(result.hash).toBe(TEST_HASH);
    expect(result.status).toBe("success");
    expect(result.blockNumber).toBe(100n);
    expect(result.gasUsed).toBe(21_000n);
  });

  it("returns the parsed ProofValidated event from receipt logs", async () => {
    const eventArgs = makeProofValidatedEvent();
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () =>
        makeTestReceipt("success", [makeProofValidatedLog(eventArgs)])) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    const result = await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(result.event).toEqual(eventArgs);
  });

  it("returns no event when a successful receipt has no ProofValidated log", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success", [])) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    const result = await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(result.event).toBeUndefined();
  });

  it("returns status: 'reverted' (no throw) so the controller can include it in the response", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted", [])) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    const result = await useCase.execute({ groupId: 1n, proof: makeProof() });

    expect(result.status).toBe("reverted");
  });

  it("relays the validated record when the receipt is successful", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("success", [])) as IBlockchainService["waitForTransaction"],
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

  it("relays the validated record using ProofValidated event args when available", async () => {
    const eventArgs = makeProofValidatedEvent();
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () =>
        makeTestReceipt("success", [makeProofValidatedLog(eventArgs)])) as IBlockchainService["waitForTransaction"],
    });
    useCase = new ValidateProofUseCase(blockchain, recordRelay);

    await useCase.execute({ groupId: 1n, proof: makeProof() });

    // recordRelay.send is async but fire-and-forget — wait a tick
    await new Promise((r) => setTimeout(r, 0));

    expect(recordRelay.sent).toHaveLength(1);
    const record = recordRelay.sent[0] as Record<string, unknown>;
    expect(record.groupId).toBe("10");
    expect(record.nullifier).toBe("321");
    expect(record.message).toBe("654");
    expect(record.scope).toBe("987");
    expect(record.transactionHash).toBe(TEST_HASH);
  });

  it("does NOT relay the record when the receipt is reverted", async () => {
    blockchain = makeTestBlockchain({
      writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
      waitForTransaction: (async () => makeTestReceipt("reverted", [])) as IBlockchainService["waitForTransaction"],
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
