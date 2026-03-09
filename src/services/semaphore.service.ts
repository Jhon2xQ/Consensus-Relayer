// src/services/semaphore.service.ts
import { injectable, inject } from "tsyringe";
import { TOKENS } from "../config/tokens";
import type { ISemaphoreService } from "../interfaces/semaphore-service.interface";
import type { IBlockchainService } from "../interfaces/blockchain-service.interface";
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
import type { Address, Hash } from "viem";
import { HTTPException } from "hono/http-exception";

@injectable()
export class SemaphoreService implements ISemaphoreService {
  constructor(@inject(TOKENS.BlockchainService) private readonly blockchainService: IBlockchainService) {}

  // ==========================================
  // GRUPOS
  // ==========================================

  async createGroup(dto: CreateGroupDto): Promise<{ groupId: bigint; result: TransactionResult }> {
    let txHash: Hash;

    // Sobrecarga de funciones en Solidity
    if (dto.admin && dto.merkleTreeDuration) {
      txHash = await this.blockchainService.writeContract("createGroup", [dto.admin, dto.merkleTreeDuration]);
    } else if (dto.admin) {
      txHash = await this.blockchainService.writeContract("createGroup", [dto.admin]);
    } else {
      txHash = await this.blockchainService.writeContract("createGroup", []);
    }

    const receipt = await this.blockchainService.waitForTransaction(txHash);

    if (receipt.status !== "success") {
      throw new HTTPException(500, { message: "Failed to create group" });
    }

    // El groupId se puede obtener del evento GroupCreated o del groupCounter
    const groupCounter = await this.getGroupCounter();
    const groupId = groupCounter;

    return {
      groupId,
      result: this.mapReceiptToResult(receipt),
    };
  }

  async acceptGroupAdmin(groupId: bigint): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("acceptGroupAdmin", [groupId]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  async updateGroupAdmin(groupId: bigint, newAdmin: Address): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("updateGroupAdmin", [groupId, newAdmin]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  // ==========================================
  // MIEMBROS
  // ==========================================

  async addMember(dto: AddMemberDto): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("addMember", [dto.groupId, dto.identityCommitment]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  async addMembers(dto: AddMembersDto): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("addMembers", [dto.groupId, dto.identityCommitments]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  async removeMember(dto: RemoveMemberDto): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("removeMember", [
      dto.groupId,
      dto.identityCommitment,
      dto.merkleProofSiblings,
    ]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  async updateMember(dto: UpdateMemberDto): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("updateMember", [
      dto.groupId,
      dto.identityCommitment,
      dto.newIdentityCommitment,
      dto.merkleProofSiblings,
    ]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  // ==========================================
  // PRUEBAS ZK
  // ==========================================

  async validateProof(dto: ValidateProofDto): Promise<TransactionResult> {
    const txHash = await this.blockchainService.writeContract("validateProof", [dto.groupId, dto.proof]);
    const receipt = await this.blockchainService.waitForTransaction(txHash);
    return this.mapReceiptToResult(receipt);
  }

  async verifyProof(dto: VerifyProofDto): Promise<boolean> {
    return this.blockchainService.readContract<boolean>("verifyProof", [dto.groupId, dto.proof]);
  }

  // ==========================================
  // LECTURA
  // ==========================================

  async getGroupInfo(groupId: bigint): Promise<GroupInfo> {
    const [admin, depth, root, size, duration] = await Promise.all([
      this.blockchainService.readContract<Address>("getGroupAdmin", [groupId]),
      this.blockchainService.readContract<bigint>("getMerkleTreeDepth", [groupId]),
      this.blockchainService.readContract<bigint>("getMerkleTreeRoot", [groupId]),
      this.blockchainService.readContract<bigint>("getMerkleTreeSize", [groupId]),
      this.blockchainService.readContract<bigint>("groups", [groupId]),
    ]);

    return {
      id: groupId,
      admin,
      merkleTreeDuration: duration,
      merkleTreeDepth: depth,
      merkleTreeRoot: root,
      merkleTreeSize: size,
    };
  }

  async hasMember(groupId: bigint, identityCommitment: bigint): Promise<boolean> {
    return this.blockchainService.readContract<boolean>("hasMember", [groupId, identityCommitment]);
  }

  async getGroupCounter(): Promise<bigint> {
    return this.blockchainService.readContract<bigint>("groupCounter", []);
  }

  async getVerifier(): Promise<Address> {
    return this.blockchainService.readContract<Address>("verifier", []);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private mapReceiptToResult(receipt: any): TransactionResult {
    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      status: receipt.status,
    };
  }
}
