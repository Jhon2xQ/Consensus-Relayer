import type { Address } from "viem";
import type {
  CreateGroupDto,
  AddMemberDto,
  AddMembersDto,
  RemoveMemberDto,
  UpdateMemberDto,
  ValidateProofDto,
  VerifyProofDto,
  GroupInfo,
  TransactionResult,
} from "../types/semaphore.types";

export interface ISemaphoreService {
  createGroup(dto: CreateGroupDto): Promise<{ groupId: bigint; result: TransactionResult }>;
  acceptGroupAdmin(groupId: bigint): Promise<TransactionResult>;
  updateGroupAdmin(groupId: bigint, newAdmin: Address): Promise<TransactionResult>;
  addMember(dto: AddMemberDto): Promise<TransactionResult>;
  addMembers(dto: AddMembersDto): Promise<TransactionResult>;
  removeMember(dto: RemoveMemberDto): Promise<TransactionResult>;
  updateMember(dto: UpdateMemberDto): Promise<TransactionResult>;
  validateProof(dto: ValidateProofDto): Promise<TransactionResult>;
  verifyProof(dto: VerifyProofDto): Promise<boolean>;
  getGroupInfo(groupId: bigint): Promise<GroupInfo>;
  hasMember(groupId: bigint, identityCommitment: bigint): Promise<boolean>;
  getGroupCounter(): Promise<bigint>;
  getVerifier(): Promise<Address>;
}
