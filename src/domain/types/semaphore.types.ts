import type { Address } from "viem";

export interface SemaphoreProof {
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

export interface GroupInfo {
  id: bigint;
  admin: Address;
  merkleTreeDuration: bigint;
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  merkleTreeSize: bigint;
}

export interface TransactionResult {
  txHash: `0x${string}`;
  blockNumber: bigint;
  gasUsed: bigint;
  status: "success" | "reverted";
}
