import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { IRecordRelayService } from "../../domain/interfaces/record-relay.interface";
import type { ValidateProofDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class ValidateProofUseCase {
  constructor(
    private readonly blockchain: IBlockchainService,
    private readonly recordRelay: IRecordRelayService,
  ) {}

  async execute(dto: ValidateProofDto): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("validateProof", [dto.groupId, dto.proof]);
    const receipt = await this.blockchain.waitForTransaction(txHash);

    // After successful validation, relay the record to the external endpoint
    if (receipt.status === "success") {
      this.recordRelay
        .send({
          groupId: dto.groupId.toString(),
          nullifier: dto.proof.nullifier.toString(),
          message: dto.proof.message.toString(),
          scope: dto.proof.scope.toString(),
          transactionHash: receipt.transactionHash,
        })
        .catch((err) => {
          console.error("Failed to relay validated record:", err);
        });
    }

    return mapReceiptToResult(receipt);
  }
}
