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

export interface GroupInfoResult {
  id: bigint;
  admin: Address;
  merkleTreeDuration: bigint | null;
  merkleTreeDepth: bigint | null;
  merkleTreeRoot: bigint | null;
  merkleTreeSize: bigint | null;
}

export interface ProofValidatedEventArgs {
  groupId: bigint;
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

export interface ProofValidatedEventArgs {
  groupId: bigint;
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}

export interface TransactionResult {
  hash: `0x${string}`;
  blockNumber: bigint;
  gasUsed: bigint;
  status: "success" | "reverted";
  event?: ProofValidatedEventArgs;
}
