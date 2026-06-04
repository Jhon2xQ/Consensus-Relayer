import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { CreateGroupDto } from "../dtos/semaphore.dto";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import type { Address } from "viem";
import { mapReceiptToResult } from "./helpers";

export interface CreateGroupResult {
  groupId: bigint;
  admin: Address;
  merkleTreeDuration: bigint | null;
  result: TransactionResult;
}

export class CreateGroupUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: CreateGroupDto): Promise<CreateGroupResult> {
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

    // T38: resolve the admin to the caller address when the caller did not provide one,
    // instead of leaking the "msg.sender" string placeholder.
    const admin = dto.admin ?? this.blockchain.getAccountAddress();

    return {
      groupId,
      admin,
      merkleTreeDuration: dto.merkleTreeDuration ?? null,
      result: mapReceiptToResult(receipt),
    };
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
