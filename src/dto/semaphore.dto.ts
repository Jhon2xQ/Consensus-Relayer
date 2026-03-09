// src/dto/semaphore.dto.ts
import { z } from "zod";

// Helper para validar bigints en strings (como vienen en JSON)
const BigIntSchema = z.string().regex(/^\d+$/).transform(BigInt);
const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

// Schema para SemaphoreProof
const SemaphoreProofSchema = z.object({
  merkleTreeDepth: BigIntSchema,
  merkleTreeRoot: BigIntSchema,
  nullifier: BigIntSchema,
  message: BigIntSchema,
  scope: BigIntSchema,
  points: z.tuple([
    BigIntSchema,
    BigIntSchema,
    BigIntSchema,
    BigIntSchema,
    BigIntSchema,
    BigIntSchema,
    BigIntSchema,
    BigIntSchema,
  ]),
});

// DTOs para endpoints
export const CreateGroupSchema = z.object({
  admin: AddressSchema.optional(),
  merkleTreeDuration: BigIntSchema.optional(),
});

export const AddMemberSchema = z.object({
  groupId: BigIntSchema,
  identityCommitment: BigIntSchema,
});

export const AddMembersSchema = z.object({
  groupId: BigIntSchema,
  identityCommitments: z.array(BigIntSchema).min(1),
});

export const RemoveMemberSchema = z.object({
  groupId: BigIntSchema,
  identityCommitment: BigIntSchema,
  merkleProofSiblings: z.array(BigIntSchema),
});

export const UpdateMemberSchema = z.object({
  groupId: BigIntSchema,
  identityCommitment: BigIntSchema,
  newIdentityCommitment: BigIntSchema,
  merkleProofSiblings: z.array(BigIntSchema),
});

export const ValidateProofSchema = z.object({
  groupId: BigIntSchema,
  proof: SemaphoreProofSchema,
});

export const VerifyProofSchema = z.object({
  groupId: BigIntSchema,
  proof: SemaphoreProofSchema,
});

export const MemberQuerySchema = z.object({
  groupId: BigIntSchema,
  identityCommitment: BigIntSchema,
});

// Tipos exportados
export type CreateGroupDto = z.infer<typeof CreateGroupSchema>;
export type AddMemberDto = z.infer<typeof AddMemberSchema>;
export type AddMembersDto = z.infer<typeof AddMembersSchema>;
export type RemoveMemberDto = z.infer<typeof RemoveMemberSchema>;
export type UpdateMemberDto = z.infer<typeof UpdateMemberSchema>;
export type ValidateProofDto = z.infer<typeof ValidateProofSchema>;
export type VerifyProofDto = z.infer<typeof VerifyProofSchema>;
