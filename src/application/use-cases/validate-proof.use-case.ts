import { parseEventLogs } from "viem";
import type { TransactionReceipt } from "viem";
import { semaphoreAbi } from "../../configs/semaphore.abi";
import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { IRecordRelayService } from "../../domain/interfaces/record-relay.interface";
import type { ProofValidatedEventArgs } from "../../domain/types/semaphore.types";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import type { ValidateProofDto } from "../dtos/semaphore.dto";
import { mapReceiptToResult } from "./helpers";

function parseProofValidatedEvent(receipt: TransactionReceipt): ProofValidatedEventArgs | undefined {
  if (receipt.status !== "success" || receipt.logs.length === 0) {
    return undefined;
  }

  try {
    const [proofEvent] = parseEventLogs<typeof semaphoreAbi, true, "ProofValidated">({
      abi: semaphoreAbi,
      eventName: "ProofValidated",
      logs: receipt.logs,
    });

    return proofEvent?.args;
  } catch {
    return undefined;
  }
}

export class ValidateProofUseCase {
  constructor(
    private readonly blockchain: IBlockchainService,
    private readonly recordRelay: IRecordRelayService,
  ) {}

  async execute(dto: ValidateProofDto): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("validateProof", [dto.groupId, dto.proof]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    const eventArgs = parseProofValidatedEvent(receipt);

    // After successful validation, relay the record to the external endpoint
    if (receipt.status === "success") {
      this.recordRelay
        .send({
          groupId: (eventArgs?.groupId ?? dto.groupId).toString(),
          nullifier: (eventArgs?.nullifier ?? dto.proof.nullifier).toString(),
          message: (eventArgs?.message ?? dto.proof.message).toString(),
          scope: (eventArgs?.scope ?? dto.proof.scope).toString(),
          transactionHash: receipt.transactionHash,
        })
        .catch((err) => {
          console.error("Failed to relay validated record:", err);
        });
    }

    return mapReceiptToResult(receipt, eventArgs);
  }
}
