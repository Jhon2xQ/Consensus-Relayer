import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import type { Address } from "viem";
import { mapReceiptToResult } from "./helpers";

export class UpdateGroupAdminUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(groupId: bigint, newAdmin: Address): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("updateGroupAdmin", [groupId, newAdmin]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    return mapReceiptToResult(receipt);
  }
}
