// src/types/event.types.ts
export interface ProofValidatedEvent {
  groupId: bigint;
  merkleTreeDepth: bigint;
  merkleTreeRoot: bigint;
  nullifier: bigint;
  message: bigint;
  scope: bigint;
  points: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export type EventListener = (event: ProofValidatedEvent) => void;
