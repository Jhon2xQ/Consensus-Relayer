import type { TransactionReceipt } from "viem";
import type { ProofValidatedEventArgs, TransactionResult } from "../../domain/types/semaphore.types";

export function mapReceiptToResult(
  receipt: TransactionReceipt,
  event?: ProofValidatedEventArgs,
): TransactionResult {
  return {
    hash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    status: receipt.status,
    event,
  };
}
