import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { AddMemberDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class AddMemberUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: AddMemberDto): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("addMember", [dto.groupId, dto.identityCommitment]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    if (receipt.status !== "success") {
      throw new Error("addMember transaction reverted");
    }
    return mapReceiptToResult(receipt);
  }
}
