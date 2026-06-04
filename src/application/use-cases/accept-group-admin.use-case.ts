import type { Address } from "viem";
import type { IBlockchainService } from "../../domain/interfaces/blockchain-service.interface";
import type { TransactionResult } from "../../domain/types/semaphore.types";
import { BadRequestException } from "../../domain/exceptions/bad-request.exception";
import { mapReceiptToResult } from "./helpers";

export class AcceptGroupAdminUseCase {
  constructor(private readonly blockchain: IBlockchainService) {}

  async execute(groupId: bigint): Promise<TransactionResult> {
    // Pre-flight: verify the relayer is authorized to accept the admin role.
    // The Semaphore ABI does not expose a `pendingAdmin` view function, so we
    // read `getGroupAdmin` (current admin) as the best-effort gate. The contract
    // still enforces the pendingAdmin check and will revert with
    // `Semaphore__CallerIsNotThePendingGroupAdmin` if the caller is not authorized.
    const currentAdmin = await this.blockchain.readContract<Address>("getGroupAdmin", [groupId]);
    const relayerAddress = this.blockchain.getAccountAddress();
    if (currentAdmin.toLowerCase() !== relayerAddress.toLowerCase()) {
      throw new BadRequestException("Caller is not the pending admin");
    }

    const txHash = await this.blockchain.writeContract("acceptGroupAdmin", [groupId]);
    const receipt = await this.blockchain.waitForTransaction(txHash);
    return mapReceiptToResult(receipt);
  }
}
