import type { Address, Hash, TransactionReceipt } from "viem";
import type { IBlockchainService } from "../../../src/domain/interfaces/blockchain-service.interface";

export const TEST_ADDRESS: Address = "0x1234567890123456789012345678901234567890";
export const TEST_HASH: Hash = "0xfeedfacefeedfacefeedfacefeedfacefeedface" as Hash;

export function makeTestReceipt(
  status: "success" | "reverted" = "success",
): TransactionReceipt {
  return {
    transactionHash: TEST_HASH,
    blockNumber: 100n,
    gasUsed: 21_000n,
    status,
  } as unknown as TransactionReceipt;
}

type Override = {
  readContract?: IBlockchainService["readContract"];
  writeContract?: IBlockchainService["writeContract"];
  writeContractWithResult?: IBlockchainService["writeContractWithResult"];
  waitForTransaction?: IBlockchainService["waitForTransaction"];
  getAccountAddress?: IBlockchainService["getAccountAddress"];
};

/**
 * Build a fake IBlockchainService with sensible defaults.
 * Each property can be overridden via the `overrides` argument.
 * The defaults are typed as `IBlockchainService[method]` to satisfy
 * the strict generic signatures (e.g. readContract<T>).
 */
export function makeTestBlockchain(overrides: Override = {}): IBlockchainService {
  const base: IBlockchainService = {
    readContract: (async () => undefined) as IBlockchainService["readContract"],
    writeContract: (async () => TEST_HASH) as IBlockchainService["writeContract"],
    writeContractWithResult: (async <T = unknown>() => ({
      hash: TEST_HASH,
      result: undefined as T,
    })) as IBlockchainService["writeContractWithResult"],
    waitForTransaction: (async () => makeTestReceipt()) as IBlockchainService["waitForTransaction"],
    getAccountAddress: () => TEST_ADDRESS,
  };
  return { ...base, ...overrides };
}
