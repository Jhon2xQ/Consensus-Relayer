import { BadRequestException } from "../domain/exceptions/bad-request.exception";

export function parsePathParam(value: string | undefined, name: string): bigint {
  if (!value) {
    throw new BadRequestException(`${name} is required`);
  }
  try {
    return BigInt(value);
  } catch {
    throw new BadRequestException(`${name} must be a valid integer`);
  }
}
