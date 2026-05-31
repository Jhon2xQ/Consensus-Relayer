import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { SemaphoreUseCases } from "../../application/use-cases";
import {
  CreateGroupSchema,
  AddMemberSchema,
  AddMembersSchema,
  RemoveMemberSchema,
  UpdateMemberSchema,
  ValidateProofSchema,
  VerifyProofSchema,
  MemberQuerySchema,
} from "../schemas/semaphore.schema";
import { ApiResponse } from "../middlewares/api-response";

export class SemaphoreController {
  constructor(private readonly useCases: SemaphoreUseCases) {}

  createGroup = async (c: Context) => {
    const body = await c.req.json();
    const dto = CreateGroupSchema.parse(body);

    if (dto.admin && !/^0x[a-fA-F0-9]{40}$/.test(dto.admin)) {
      throw new HTTPException(400, { message: "Invalid admin address format" });
    }

    const result = await this.useCases.createGroup.execute(dto);

    return c.json(
      ApiResponse.success("Group created successfully", {
        groupId: result.groupId.toString(),
        admin: dto.admin || "msg.sender",
        merkleTreeDuration: dto.merkleTreeDuration?.toString(),
        transaction: {
          hash: result.result.txHash,
          blockNumber: Number(result.result.blockNumber),
          gasUsed: result.result.gasUsed.toString(),
          status: result.result.status,
        },
      }),
      201,
    );
  };

  acceptGroupAdmin = async (c: Context) => {
    const groupId = BigInt(c.req.param("groupId")!);
    const result = await this.useCases.acceptGroupAdmin.execute(groupId);

    return c.json(
      ApiResponse.success("Group admin accepted", {
        groupId: groupId.toString(),
        transaction: result,
      }),
    );
  };

  updateGroupAdmin = async (c: Context) => {
    const groupId = BigInt(c.req.param("groupId")!);
    const body = await c.req.json();

    if (!body.newAdmin || !/^0x[a-fA-F0-9]{40}$/.test(body.newAdmin)) {
      throw new HTTPException(400, { message: "Invalid newAdmin address" });
    }

    const result = await this.useCases.updateGroupAdmin.execute(groupId, body.newAdmin);

    return c.json(
      ApiResponse.success("Group admin updated", {
        groupId: groupId.toString(),
        newAdmin: body.newAdmin,
        transaction: result,
      }),
    );
  };

  getGroupInfo = async (c: Context) => {
    const groupId = BigInt(c.req.param("groupId")!);
    const info = await this.useCases.getGroupInfo.execute(groupId);

    return c.json(
      ApiResponse.success("Group info retrieved successfully", {
        id: info.id.toString(),
        admin: info.admin,
        merkleTreeDuration: info.merkleTreeDuration.toString(),
        merkleTreeDepth: Number(info.merkleTreeDepth),
        merkleTreeRoot: info.merkleTreeRoot.toString(),
        merkleTreeSize: info.merkleTreeSize.toString(),
      }),
    );
  };

  addMember = async (c: Context) => {
    const body = await c.req.json();
    const dto = AddMemberSchema.parse(body);
    const result = await this.useCases.addMember.execute(dto);

    return c.json(
      ApiResponse.success("Member added to group", {
        groupId: dto.groupId.toString(),
        identityCommitment: dto.identityCommitment.toString(),
        transaction: {
          hash: result.txHash,
          blockNumber: Number(result.blockNumber),
          gasUsed: result.gasUsed.toString(),
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
      ApiResponse.success(`${dto.identityCommitments.length} members added to group`, {
        groupId: dto.groupId.toString(),
        count: dto.identityCommitments.length,
        identityCommitments: dto.identityCommitments.map((c: bigint) => c.toString()),
        transaction: {
          hash: result.txHash,
          blockNumber: Number(result.blockNumber),
          gasUsed: result.gasUsed.toString(),
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
      ApiResponse.success("Member removed from group", {
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
      ApiResponse.success("Member updated", {
        groupId: dto.groupId.toString(),
        oldIdentityCommitment: dto.identityCommitment.toString(),
        newIdentityCommitment: dto.newIdentityCommitment.toString(),
        transaction: result,
      }),
    );
  };

  hasMember = async (c: Context) => {
    const query = c.req.query();
    const dto = MemberQuerySchema.parse({
      groupId: query.groupId,
      identityCommitment: query.identityCommitment,
    });

    const hasMember = await this.useCases.hasMember.execute(dto.groupId, dto.identityCommitment);

    return c.json(
      ApiResponse.success("Member check completed", {
        groupId: dto.groupId.toString(),
        identityCommitment: dto.identityCommitment.toString(),
        hasMember,
      }),
    );
  };

  validateProof = async (c: Context) => {
    const body = await c.req.json();
    const dto = ValidateProofSchema.parse(body);
    const result = await this.useCases.validateProof.execute(dto);

    return c.json(
      ApiResponse.success("Proof validated on-chain", {
        groupId: dto.groupId.toString(),
        nullifier: dto.proof.nullifier.toString(),
        message: dto.proof.message.toString(),
        scope: dto.proof.scope.toString(),
        transaction: {
          hash: result.txHash,
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
      ApiResponse.success("Proof verification completed", {
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
      ApiResponse.success("Group counter retrieved successfully", {
        totalGroups: counter.toString(),
        nextGroupId: counter.toString(),
      }),
    );
  };

  getVerifier = async (c: Context) => {
    const verifier = await this.useCases.getVerifier.execute();

    return c.json(
      ApiResponse.success("Verifier address retrieved successfully", {
        verifierAddress: verifier,
      }),
    );
  };
}
