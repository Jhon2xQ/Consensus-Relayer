import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { UpdateMemberDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class UpdateMemberUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: UpdateMemberDto): Promise<TransactionResult> {
    const txHash = await this.blockchain.writeContract("updateMember", [
      dto.groupId,
      dto.identityCommitment,
      dto.newIdentityCommitment,
      dto.merkleProofSiblings,
    ]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    return mapReceiptToResult(receipt);
  }
}
