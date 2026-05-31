import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";

export class GetGroupCounterUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(): Promise<bigint> {
    return this.blockchain.readContract<bigint>("groupCounter", []);
  }
}
