import { z } from "zod";
import { getAddress } from "viem";

export const BigIntSchema = z
  .string()
  .regex(/^\d+$/, "Must be a numeric string")
  .max(78, "Exceeds uint256 max digits")
  .transform((v) => BigInt(v));

export const AddressSchema = z
  .string()
  .refine((v) => /^0x[a-fA-F0-9]{40}$/.test(v), "Invalid address format")
  .transform((v, ctx) => {
    try {
      return getAddress(v);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid EIP-55 checksum" });
      return z.NEVER;
    }
  });

export const MerkleTreeDepthSchema = z
  .number()
  .int("Must be an integer")
  .positive("Must be positive")
  .max(256, "Max Merkle tree depth is 256")
  .transform((v) => BigInt(v));

const SemaphoreProofSchema = z.object({
  merkleTreeDepth: MerkleTreeDepthSchema,
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
  identityCommitments: z.array(BigIntSchema),
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

export const UpdateGroupAdminSchema = z.object({
  newAdmin: AddressSchema,
});

export const UpdateMerkleTreeDurationSchema = z.object({
  newMerkleTreeDuration: BigIntSchema,
});

export const MemberQuerySchema = z.object({
  groupId: BigIntSchema,
  identityCommitment: BigIntSchema,
});

export const IndexOfQuerySchema = z.object({
  groupId: BigIntSchema,
  identityCommitment: BigIntSchema,
});
