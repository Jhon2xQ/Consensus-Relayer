import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class AcceptGroupAdminUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(groupId: bigint): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("acceptGroupAdmin", [groupId]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    return mapReceiptToResult(receipt);
  }
}
