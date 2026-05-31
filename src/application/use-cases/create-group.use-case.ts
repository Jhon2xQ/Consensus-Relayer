import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { CreateGroupDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { mapReceiptToResult } from "./helpers";

export class CreateGroupUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: CreateGroupDto): Promise<{ groupId: bigint; result: TransactionResult }> {
    let txHash: `0x${string}`;

    if (dto.admin && dto.merkleTreeDuration) {
      txHash = await this.blockchain.writeContract("createGroup", [dto.admin, dto.merkleTreeDuration]);
    } else if (dto.admin) {
      txHash = await this.blockchain.writeContract("createGroup", [dto.admin]);
    } else {
      txHash = await this.blockchain.writeContract("createGroup", []);
    }

    const receipt = await this.blockchain.waitForTransaction(txHash);
    if (receipt.status !== "success") {
      throw new Error("Failed to create group");
    }

    const groupCounter = await this.blockchain.readContract<bigint>("groupCounter", []);
    return { groupId: groupCounter, result: mapReceiptToResult(receipt) };
  }
}
