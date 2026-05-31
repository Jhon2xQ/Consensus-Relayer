import type { TransactionReceipt } from "viem";
import type { TransactionResult } from "../../domain/types/semaphore.types";

export function mapReceiptToResult(receipt: TransactionReceipt): TransactionResult {
  return {
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    status: receipt.status,
  };
}
