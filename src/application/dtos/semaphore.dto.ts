import type { SemaphoreProof } from "../../domain/types/semaphore.types";
import type { Address } from "viem";

export interface CreateGroupDto {
  admin?: Address;
  merkleTreeDuration?: bigint;
}

export interface AddMemberDto {
  groupId: bigint;
  identityCommitment: bigint;
}

export interface AddMembersDto {
  groupId: bigint;
  identityCommitments: bigint[];
}

export interface RemoveMemberDto {
  groupId: bigint;
  identityCommitment: bigint;
  merkleProofSiblings: bigint[];
}

export interface UpdateMemberDto {
  groupId: bigint;
  identityCommitment: bigint;
  newIdentityCommitment: bigint;
  merkleProofSiblings: bigint[];
}

export interface ValidateProofDto {
  groupId: bigint;
  proof: SemaphoreProof;
}

export interface VerifyProofDto {
  groupId: bigint;
  proof: SemaphoreProof;
}

export interface MemberQuery {
  groupId: bigint;
  identityCommitment: bigint;
}
