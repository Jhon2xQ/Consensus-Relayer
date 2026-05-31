import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";

export class HasMemberUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(groupId: bigint, identityCommitment: bigint): Promise<boolean> {
    return this.blockchain.readContract<boolean>("hasMember", [groupId, identityCommitment]);
  }
}
