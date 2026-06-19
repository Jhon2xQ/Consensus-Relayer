import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import { publicClient, walletClient, account } from "../../configs/blockchain.config";
import { semaphoreAbi } from "../../configs/semaphore.abi";
import { env } from "../../configs/env.config";
import type { Address, Hash, TransactionReceipt } from "viem";

/**
 * Per-function gas overrides. These bypass eth_estimateGas to avoid the
 * "intrinsic gas too high" error caused by Alchemy returning inflated
 * estimates on Optimism Sepolia + Flashblocks (where the effective block
 * gas limit is much lower than the theoretical 60M).
 *
 * Values are based on observed gas usage for SemaphoreV4 operations:
 * - createGroup: initializes a MerkleTree (depth 20) with zeros
 * - addMembers: scales with batch size; 3M covers ~10 identities
 * - addMember/updateMember/removeMember: single MerkleTree insert/update
 * - validateProof: SNARK verification (~500K)
 *
 * Functions not listed here fall back to eth_estimateGas (efficient for
 * simple SSTORE operations like updateGroupAdmin).
 */
const GAS_OVERRIDES: Record<string, bigint> = {
  createGroup: 8_000_000n,
  addMembers: 3_000_000n,
  addMember: 1_500_000n,
  updateMember: 1_500_000n,
  removeMember: 1_500_000n,
  validateProof: 800_000n,
};

export class BlockchainService implements IBlockchainService {
  private get contractAddress(): `0x${string}` {
    return env.CONTRACT_ADDRESS as `0x${string}`;
  }

  /**
   * Resolve the effective gas limit for a write function.
   * Priority: explicit param > GAS_OVERRIDES[functionName] > env.DEFAULT_TX_GAS > undefined.
   */
  private resolveGas(functionName: string, explicitGas?: bigint): bigint | undefined {
    if (explicitGas !== undefined) return explicitGas;
    if (GAS_OVERRIDES[functionName] !== undefined) return GAS_OVERRIDES[functionName];
    return env.DEFAULT_TX_GAS;
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

  async writeContract(
    functionName: string,
    args: unknown[],
    value: bigint = BigInt(0),
    gas?: bigint,
  ): Promise<Hash> {
    const effectiveGas = this.resolveGas(functionName, gas);
    return walletClient.writeContract({
      address: this.contractAddress,
      abi: semaphoreAbi,
      functionName,
      args,
      value,
      account,
      ...(effectiveGas !== undefined ? { gas: effectiveGas } : {}),
    });
  }

  async writeContractWithResult<T = unknown>(
    functionName: string,
    args: unknown[],
    value: bigint = BigInt(0),
    gas?: bigint,
  ): Promise<{ hash: Hash; result: T }> {
    const effectiveGas = this.resolveGas(functionName, gas);
    const { request, result } = await publicClient.simulateContract({
      address: this.contractAddress,
      abi: semaphoreAbi,
      functionName,
      args,
      value,
      account,
      ...(effectiveGas !== undefined ? { gas: effectiveGas } : {}),
    });

    const hash = await walletClient.writeContract(request);
    return { hash, result: result as T };
  }

  async waitForTransaction(hash: Hash): Promise<TransactionReceipt> {
    return publicClient.waitForTransactionReceipt({ hash });
  }

  getAccountAddress(): Address {
    return account.address;
  }
}
