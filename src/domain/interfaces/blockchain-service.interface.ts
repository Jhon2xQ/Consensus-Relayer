import type { Hash, TransactionReceipt } from "viem";

export interface IBlockchainService {
  readContract<T>(functionName: string, args?: unknown[]): Promise<T>;
  writeContract(functionName: string, args: unknown[], value?: bigint): Promise<Hash>;
  waitForTransaction(hash: Hash): Promise<TransactionReceipt>;
}
