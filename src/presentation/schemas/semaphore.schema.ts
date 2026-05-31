import { z } from "zod";

const BigIntSchema = z.string().regex(/^\d+$/).transform(BigInt);
const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((val) => val as `0x${string}`);

const SemaphoreProofSchema = z.object({
  merkleTreeDepth: BigIntSchema,
  merkleTreeRoot: BigIntSchema,
  nullifier: BigIntSchema,
  message: BigIntSchema,
  scope: BigIntSchema,
  points: z.tuple([
    BigIntSchema, BigIntSchema, BigIntSchema, BigIntSchema,
    BigIntSchema, BigIntSchema, BigIntSchema, BigIntSchema,
  ]),
});

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
