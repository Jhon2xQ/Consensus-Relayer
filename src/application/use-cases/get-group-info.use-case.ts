import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { GroupInfoResult } from "../../domain/types/semaphore.types";
import type { Address } from "viem";
import { SemaphoreException } from "../../domain/exceptions/semaphore.exception";

async function safeRead<T>(
  fn: () => Promise<T>,
  onError: (err: unknown) => void,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    onError(err);
    return null;
  }
}

export class GetGroupInfoUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(groupId: bigint): Promise<GroupInfoResult> {
    // 1) getGroupAdmin is the existence check — if it reverts, the group does not exist.
    let admin: Address;
    try {
      admin = await this.blockchain.readContract<Address>("getGroupAdmin", [groupId]);
    } catch (err) {
      console.error(`[GetGroupInfoUseCase] group ${groupId} not found:`, err);
      throw SemaphoreException.groupNotFound(groupId);
    }

    // 2) Granular reads — each field may fail independently without breaking the rest.
    const [merkleTreeDuration, merkleTreeDepth, merkleTreeRoot, merkleTreeSize] =
      await Promise.all([
        safeRead(
          () => this.blockchain.readContract<bigint>("groups", [groupId]),
          (err) => console.error(`[GetGroupInfoUseCase] groups(${groupId}) failed:`, err),
        ),
        safeRead(
          () => this.blockchain.readContract<bigint>("getMerkleTreeDepth", [groupId]),
          (err) => console.error(`[GetGroupInfoUseCase] getMerkleTreeDepth(${groupId}) failed:`, err),
        ),
        safeRead(
          () => this.blockchain.readContract<bigint>("getMerkleTreeRoot", [groupId]),
          (err) => console.error(`[GetGroupInfoUseCase] getMerkleTreeRoot(${groupId}) failed:`, err),
        ),
        safeRead(
          () => this.blockchain.readContract<bigint>("getMerkleTreeSize", [groupId]),
          (err) => console.error(`[GetGroupInfoUseCase] getMerkleTreeSize(${groupId}) failed:`, err),
        ),
      ]);

    return {
      id: groupId,
      admin,
      merkleTreeDuration,
      merkleTreeDepth,
      merkleTreeRoot,
      merkleTreeSize,
    };
  }
}
