import { describe, it, expect } from "bun:test";
import { parsePathParam } from "../../src/common/parse-path-param";
import { BadRequestException } from "../../src/domain/exceptions/bad-request.exception";

describe("parsePathParam (T11)", () => {
  it("returns a bigint for a valid numeric string", () => {
    expect(parsePathParam("123", "groupId")).toBe(123n);
  });

  it("returns BigInt(0) for the string '0'", () => {
    expect(parsePathParam("0", "groupId")).toBe(0n);
  });

  it("preserves very large values as bigint", () => {
    expect(parsePathParam("9999999999999999999999999999", "groupId")).toBe(
      BigInt("9999999999999999999999999999"),
    );
  });

  it("throws BadRequestException with the param name when value is undefined", () => {
    let caught: unknown;
    try {
      parsePathParam(undefined, "groupId");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).message).toBe("groupId is required");
    expect((caught as BadRequestException).statusCode).toBe(400);
  });

  it("throws BadRequestException when value is empty string", () => {
    let caught: unknown;
    try {
      parsePathParam("", "groupId");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).message).toBe("groupId is required");
  });

  it("throws BadRequestException when value is non-numeric", () => {
    let caught: unknown;
    try {
      parsePathParam("abc", "groupId");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).message).toBe("groupId must be a valid integer");
  });

  it("throws BadRequestException for decimal values (BigInt rejects them)", () => {
    let caught: unknown;
    try {
      parsePathParam("12.3", "groupId");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).message).toBe("groupId must be a valid integer");
  });

  it("throws BadRequestException for hex-like values that BigInt rejects", () => {
    let caught: unknown;
    try {
      parsePathParam("0xZZ", "groupId");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).message).toBe("groupId must be a valid integer");
  });

  it("uses the provided param name in the error message", () => {
    let caught: unknown;
    try {
      parsePathParam("xyz", "merkleTreeDepth");
    } catch (e) {
      caught = e;
    }
    expect((caught as BadRequestException).message).toContain("merkleTreeDepth");
  });
});
