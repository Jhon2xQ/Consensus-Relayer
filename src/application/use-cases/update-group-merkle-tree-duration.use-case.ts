import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class UpdateGroupMerkleTreeDurationUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: { groupId: bigint; newMerkleTreeDuration: bigint }): Promise<TransactionResult> {
    const hash = await this.blockchain.writeContract("updateGroupMerkleTreeDuration", [
      dto.groupId,
      dto.newMerkleTreeDuration,
    ]);
    const receipt = await this.blockchain.waitForTransaction(hash);
    if (receipt.status !== "success") {
      throw new Error("updateGroupMerkleTreeDuration transaction reverted");
    }
    return mapReceiptToResult(receipt);
  }
}
