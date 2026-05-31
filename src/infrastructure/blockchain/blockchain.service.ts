import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import { publicClient, walletClient, account } from "../../common/configs/blockchain.config";
import { semaphoreAbi } from "../../common/configs/semaphore.abi";
import { env } from "../../common/configs/env.config";
import type { Hash, TransactionReceipt } from "viem";

export class BlockchainService implements IBlockchainService {
  private get contractAddress(): `0x${string}` {
    return env.CONTRACT_ADDRESS as `0x${string}`;
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
    return publicClient.waitForTransactionReceipt({ hash });
  }
}
