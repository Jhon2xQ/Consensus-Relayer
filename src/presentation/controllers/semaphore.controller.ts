import type { Context } from "hono";
import type { SemaphoreUseCases } from "../../application/use-cases";
import {
  CreateGroupSchema,
  AddMemberSchema,
  AddMembersSchema,
  RemoveMemberSchema,
  UpdateMemberSchema,
  ValidateProofSchema,
  VerifyProofSchema,
  UpdateGroupAdminSchema,
  UpdateMerkleTreeDurationSchema,
  MemberQuerySchema,
  IndexOfQuerySchema,
} from "../schemas/semaphore.schema";
import { ok, fail, formatZodIssues } from "../../common/responses";
import { parsePathParam } from "../../common/parse-path-param";

export class SemaphoreController {
  constructor(private readonly useCases: SemaphoreUseCases) {}

  createGroup = async (c: Context) => {
    const body = await c.req.json();
    const dto = CreateGroupSchema.parse(body);

    const result = await this.useCases.createGroup.execute(dto);

    return c.json(
      ok("Group created successfully", {
        groupId: result.groupId.toString(),
        admin: result.admin,
        merkleTreeDuration: result.merkleTreeDuration === null ? null : result.merkleTreeDuration.toString(),
        transaction: {
          hash: result.result.hash,
          blockNumber: Number(result.result.blockNumber),
          gasUsed: result.result.gasUsed.toString(),
          status: result.result.status,
        },
      }),
      201,
    );
  };

  acceptGroupAdmin = async (c: Context) => {
    const groupId = parsePathParam(c.req.param("groupId"), "groupId");
    const result = await this.useCases.acceptGroupAdmin.execute(groupId);

    return c.json(
      ok("Group admin accepted", {
        groupId: groupId.toString(),
        transaction: result,
      }),
    );
  };

  updateGroupAdmin = async (c: Context) => {
    const groupId = parsePathParam(c.req.param("groupId"), "groupId");
    const body = await c.req.json();
    const parsed = UpdateGroupAdminSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fail("Validation error", { details: formatZodIssues(parsed.error) }), 400);
    }

    const result = await this.useCases.updateGroupAdmin.execute(groupId, parsed.data.newAdmin);

    return c.json(
      ok("Group admin updated", {
        groupId: groupId.toString(),
        newAdmin: parsed.data.newAdmin,
        transaction: result,
      }),
    );
  };

  updateGroupMerkleTreeDuration = async (c: Context) => {
    const groupId = parsePathParam(c.req.param("groupId"), "groupId");
    const body = await c.req.json();
    const parsed = UpdateMerkleTreeDurationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(fail("Validation error", { details: formatZodIssues(parsed.error) }), 400);
    }

    const result = await this.useCases.updateGroupMerkleTreeDuration.execute({
      groupId,
      newMerkleTreeDuration: parsed.data.newMerkleTreeDuration,
    });

    return c.json(
      ok("Group merkle tree duration updated", {
        groupId: groupId.toString(),
        newMerkleTreeDuration: parsed.data.newMerkleTreeDuration.toString(),
        transaction: result,
      }),
    );
  };

  getGroupInfo = async (c: Context) => {
    const groupId = parsePathParam(c.req.param("groupId"), "groupId");
    const info = await this.useCases.getGroupInfo.execute(groupId);

    return c.json(
      ok("Group info retrieved successfully", {
        id: info.id.toString(),
        admin: info.admin,
        merkleTreeDuration: info.merkleTreeDuration?.toString() ?? null,
        merkleTreeDepth: info.merkleTreeDepth !== null ? Number(info.merkleTreeDepth) : null,
        merkleTreeRoot: info.merkleTreeRoot?.toString() ?? null,
        merkleTreeSize: info.merkleTreeSize?.toString() ?? null,
      }),
    );
  };

  addMember = async (c: Context) => {
    const body = await c.req.json();
    const dto = AddMemberSchema.parse(body);
    const result = await this.useCases.addMember.execute(dto);

    return c.json(
      ok("Member added to group", {
        groupId: dto.groupId.toString(),
        identityCommitment: dto.identityCommitment.toString(),
        transaction: {
          hash: result.hash,
          blockNumber: Number(result.blockNumber),
          gasUsed: result.gasUsed.toString(),
          status: result.status,
        },
      }),
      201,
    );
  };

  addMembers = async (c: Context) => {
    const body = await c.req.json();
    const dto = AddMembersSchema.parse(body);
    const result = await this.useCases.addMembers.execute(dto);

    return c.json(
      ok(`${dto.identityCommitments.length} members added to group`, {
        groupId: dto.groupId.toString(),
        count: dto.identityCommitments.length,
        identityCommitments: dto.identityCommitments.map((ic: bigint) => ic.toString()),
        transaction: {
          hash: result.hash,
          blockNumber: Number(result.blockNumber),
          gasUsed: result.gasUsed.toString(),
          status: result.status,
        },
      }),
      201,
    );
  };

  removeMember = async (c: Context) => {
    const body = await c.req.json();
    const dto = RemoveMemberSchema.parse(body);
    const result = await this.useCases.removeMember.execute(dto);

    return c.json(
      ok("Member removed from group", {
        groupId: dto.groupId.toString(),
        identityCommitment: dto.identityCommitment.toString(),
        transaction: result,
      }),
    );
  };

  updateMember = async (c: Context) => {
    const body = await c.req.json();
    const dto = UpdateMemberSchema.parse(body);
    const result = await this.useCases.updateMember.execute(dto);

    return c.json(
      ok("Member updated", {
        groupId: dto.groupId.toString(),
        oldIdentityCommitment: dto.identityCommitment.toString(),
        newIdentityCommitment: dto.newIdentityCommitment.toString(),
        transaction: result,
      }),
    );
  };

  hasMember = async (c: Context) => {
    const parsed = MemberQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(fail("Validation error", { details: formatZodIssues(parsed.error) }), 400);
    }

    const hasMember = await this.useCases.hasMember.execute(parsed.data.groupId, parsed.data.identityCommitment);

    return c.json(
      ok("Member check completed", {
        groupId: parsed.data.groupId.toString(),
        identityCommitment: parsed.data.identityCommitment.toString(),
        hasMember,
      }),
    );
  };

  indexOf = async (c: Context) => {
    const parsed = IndexOfQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(fail("Validation error", { details: formatZodIssues(parsed.error) }), 400);
    }

    const result = await this.useCases.indexOf.execute(parsed.data);

    return c.json(
      ok("Member index retrieved successfully", {
        groupId: result.groupId.toString(),
        identityCommitment: result.identityCommitment.toString(),
        index: result.index.toString(),
      }),
    );
  };

  validateProof = async (c: Context) => {
    const body = await c.req.json();
    const dto = ValidateProofSchema.parse(body);
    console.log(dto);
    const result = await this.useCases.validateProof.execute(dto);

    return c.json(
      ok("Proof validated on-chain", {
        groupId: dto.groupId.toString(),
        nullifier: dto.proof.nullifier.toString(),
        message: dto.proof.message.toString(),
        scope: dto.proof.scope.toString(),
        transaction: {
          hash: result.hash,
          blockNumber: Number(result.blockNumber),
          gasUsed: result.gasUsed.toString(),
          status: result.status,
        },
      }),
    );
  };

  verifyProof = async (c: Context) => {
    const body = await c.req.json();
    const dto = VerifyProofSchema.parse(body);
    const isValid = await this.useCases.verifyProof.execute(dto);

    return c.json(
      ok("Proof verification completed", {
        groupId: dto.groupId.toString(),
        isValid,
        proof: {
          nullifier: dto.proof.nullifier.toString(),
          message: dto.proof.message.toString(),
          scope: dto.proof.scope.toString(),
        },
      }),
    );
  };

  getGroupCounter = async (c: Context) => {
    const counter = await this.useCases.getGroupCounter.execute();

    return c.json(
      ok("Group counter retrieved successfully", {
        totalGroups: counter.toString(),
        nextGroupId: counter.toString(),
      }),
    );
  };

  getVerifier = async (c: Context) => {
    const verifier = await this.useCases.getVerifier.execute();

    return c.json(
      ok("Verifier address retrieved successfully", {
        verifierAddress: verifier,
      }),
    );
  };
}
