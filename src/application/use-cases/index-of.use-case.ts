import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";

export interface IndexOfDto {
  groupId: bigint;
  identityCommitment: bigint;
}

export interface IndexOfResult {
  groupId: bigint;
  identityCommitment: bigint;
  index: bigint;
}

export class IndexOfUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: IndexOfDto): Promise<IndexOfResult> {
    const index = await this.blockchain.readContract<bigint>("indexOf", [
      dto.groupId,
      dto.identityCommitment,
    ]);
    return {
      groupId: dto.groupId,
      identityCommitment: dto.identityCommitment,
      index,
    };
  }
}
