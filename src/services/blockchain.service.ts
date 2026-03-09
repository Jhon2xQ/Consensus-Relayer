import { injectable } from "tsyringe";
import type { IBlockchainService } from "../interfaces/blockchain-service.interface";
import { publicClient, walletClient, account } from "../config/blockchain.config";
import { semaphoreAbi } from "../abi/semaphore.abi";
import type { Hash, TransactionReceipt, Address } from "viem";

@injectable()
export class BlockchainService implements IBlockchainService {
  private get contractAddress() {
    return process.env.CONTRACT_ADDRESS as `0x${string}`;
  }

  async readContract<T>(functionName: string, args: unknown[] = []): Promise<T> {
    const result = (await publicClient.readContract({
      address: this.contractAddress,
      abi: semaphoreAbi,
      functionName,
      args,
    })) as T;
    return result;
  }

  async writeContract(functionName: string, args: unknown[], value: bigint = BigInt(0)): Promise<Hash> {
    const hash = await walletClient.writeContract({
      address: this.contractAddress,
      abi: semaphoreAbi,
      functionName,
      args,
      value,
      account,
    });
    return hash;
  }

  async waitForTransaction(hash: Hash): Promise<TransactionReceipt> {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt;
  }
}
