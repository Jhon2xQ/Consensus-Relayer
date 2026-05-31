import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { VerifyProofDto } from "../dtos/semaphore.dto";

export class VerifyProofUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(dto: VerifyProofDto): Promise<boolean> {
    return this.blockchain.readContract<boolean>("verifyProof", [dto.groupId, dto.proof]);
  }
}
