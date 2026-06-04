import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { AddMembersDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class AddMembersUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: AddMembersDto): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("addMembers", [dto.groupId, dto.identityCommitments]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    if (receipt.status !== "success") {
      throw new Error("addMembers transaction reverted");
    }
    return mapReceiptToResult(receipt);
  }
}
