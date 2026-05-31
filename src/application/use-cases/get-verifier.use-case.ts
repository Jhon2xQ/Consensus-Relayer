import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { Address } from "viem";

export class GetVerifierUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(): Promise<Address> {
    return this.blockchain.readContract<Address>("verifier", []);
  }
}
