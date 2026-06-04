import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { RemoveMemberDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class RemoveMemberUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: RemoveMemberDto): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("removeMember", [
      dto.groupId,
      dto.identityCommitment,
      dto.merkleProofSiblings,
    ]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    if (receipt.status !== "success") {
      throw new Error("removeMember transaction reverted");
    }
    return mapReceiptToResult(receipt);
  }
}
