import type { Address, Hash, TransactionReceipt } from "viem";

export interface IBlockchainService {
  readContract<T>(functionName: string, args?: unknown[]): Promise<T>;
  writeContract(functionName: string, args: unknown[], value?: bigint): Promise<Hash>;
  writeContractWithResult<T = unknown>(
    functionName: string,
    args: unknown[],
    value?: bigint,
  ): Promise<{ hash: Hash; result: T }>;
  waitForTransaction(hash: Hash): Promise<TransactionReceipt>;
  getAccountAddress(): Address;
}
