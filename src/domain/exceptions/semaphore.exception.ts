import { DomainException } from "./domain.exception";

export class SemaphoreException extends DomainException {
  static groupNotFound(id: bigint): SemaphoreException {
    return new SemaphoreException(`Group ${id} not found`, 404);
  }

  static memberAlreadyExists(): SemaphoreException {
    return new SemaphoreException("Member already exists in group", 409);
  }

  static invalidProof(): SemaphoreException {
    return new SemaphoreException("Invalid proof", 400);
  }

  static transactionFailed(): SemaphoreException {
    return new SemaphoreException("Transaction failed", 500);
  }
}
