import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { CreateGroupDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class CreateGroupUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: CreateGroupDto): Promise<{ groupId: bigint; result: TransactionResult }> {
    const args: unknown[] = this.buildArgs(dto);

    // CRIT-01: groupId comes from the decoded return value of createGroup (single round-trip).
    // No secondary readContract("groupCounter") call is needed.
    const { hash, result: groupId } = await this.blockchain.writeContractWithResult<bigint>(
      "createGroup",
      args,
    );

    const receipt = await this.blockchain.waitForTransaction(hash);
    if (receipt.status !== "success") {
      throw new Error("Failed to create group");
    }

    return { groupId, result: mapReceiptToResult(receipt) };
  }

  private buildArgs(dto: CreateGroupDto): unknown[] {
    if (dto.admin && dto.merkleTreeDuration) {
      return [dto.admin, dto.merkleTreeDuration];
    }
    if (dto.admin) {
      return [dto.admin];
    }
    return [];
  }
}
