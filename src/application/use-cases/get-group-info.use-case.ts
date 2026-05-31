import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { GroupInfo } from "../../domain/types/semaphore.types";
import type { Address } from "viem";

export class GetGroupInfoUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(groupId: bigint): Promise<GroupInfo> {
    const [admin, depth, root, size, duration] = await Promise.all([
      this.blockchain.readContract<Address>("getGroupAdmin", [groupId]),
      this.blockchain.readContract<bigint>("getMerkleTreeDepth", [groupId]),
      this.blockchain.readContract<bigint>("getMerkleTreeRoot", [groupId]),
      this.blockchain.readContract<bigint>("getMerkleTreeSize", [groupId]),
      this.blockchain.readContract<bigint>("groups", [groupId]),
    ]);

    return {
      id: groupId,
      admin,
      merkleTreeDuration: duration,
      merkleTreeDepth: depth,
      merkleTreeRoot: root,
      merkleTreeSize: size,
    };
  }
}
