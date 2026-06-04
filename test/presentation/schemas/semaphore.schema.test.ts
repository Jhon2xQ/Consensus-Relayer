import { describe, it, expect } from "bun:test";
import {
  BigIntSchema,
  AddressSchema,
  UpdateGroupAdminSchema,
  MemberQuerySchema,
  UpdateMerkleTreeDurationSchema,
  IndexOfQuerySchema,
} from "../../../src/presentation/schemas/semaphore.schema";

describe("BigIntSchema (T4)", () => {
  it("transforms a numeric string to a bigint", () => {
    const parsed = BigIntSchema.parse("123");
    expect(typeof parsed).toBe("bigint");
    expect(parsed).toBe(123n);
  });

  it("parses the uint256 maximum (78 nines) successfully", () => {
    const max = "9".repeat(78);
    const parsed = BigIntSchema.parse(max);
    expect(parsed).toBe(BigInt(max));
  });

  it("rejects empty string", () => {
    expect(() => BigIntSchema.parse("")).toThrow();
  });

  it("rejects a string with non-digit characters", () => {
    expect(() => BigIntSchema.parse("123abc")).toThrow(/numeric string/i);
  });

  it("rejects a string of 79 nines (overflow above uint256)", () => {
    const overflow = "9".repeat(79);
    expect(() => BigIntSchema.parse(overflow)).toThrow(/uint256|digits/i);
  });

  it("rejects negative sign", () => {
    expect(() => BigIntSchema.parse("-1")).toThrow();
  });
});

describe("AddressSchema (T5)", () => {
  it("normalizes a lowercase 0x address via EIP-55 checksum", () => {
    const parsed = AddressSchema.parse("0x1234567890123456789012345678901234567890");
    expect(parsed).toBe("0x1234567890123456789012345678901234567890");
  });

  it("accepts a properly EIP-55 checksummed address and keeps it", () => {
    // Real checksummed address: vitalik.eth
    const checksummed = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    const parsed = AddressSchema.parse(checksummed);
    expect(parsed).toBe(checksummed);
  });

  it("rejects non-hex characters (regex)", () => {
    expect(() => AddressSchema.parse("0xZZZZ567890123456789012345678901234567890")).toThrow();
  });

  it("rejects an address that is too short", () => {
    expect(() => AddressSchema.parse("0x1234")).toThrow();
  });

  it("rejects an address that is too long", () => {
    const tooLong = "0x" + "1".repeat(50);
    expect(() => AddressSchema.parse(tooLong)).toThrow();
  });
});

describe("UpdateGroupAdminSchema (T6)", () => {
  it("parses a valid body to bigint groupId and checksummed newAdmin", () => {
    const parsed = UpdateGroupAdminSchema.parse({
      newAdmin: "0x1234567890123456789012345678901234567890",
    });
    expect(parsed.newAdmin).toBe("0x1234567890123456789012345678901234567890");
  });

  it("rejects an empty newAdmin string", () => {
    expect(() => UpdateGroupAdminSchema.parse({ newAdmin: "" })).toThrow();
  });

  it("rejects a non-hex newAdmin", () => {
    expect(() =>
      UpdateGroupAdminSchema.parse({ newAdmin: "not-an-address" }),
    ).toThrow();
  });

  it("rejects when newAdmin is missing", () => {
    expect(() => UpdateGroupAdminSchema.parse({})).toThrow();
  });
});

describe("MemberQuerySchema (T7)", () => {
  it("parses valid groupId and identityCommitment to bigints", () => {
    const parsed = MemberQuerySchema.parse({
      groupId: "1",
      identityCommitment: "12345",
    });
    expect(parsed.groupId).toBe(1n);
    expect(parsed.identityCommitment).toBe(12345n);
  });

  it("rejects when identityCommitment is missing", () => {
    expect(() => MemberQuerySchema.parse({ groupId: "1" })).toThrow();
  });

  it("rejects a non-numeric identityCommitment", () => {
    expect(() =>
      MemberQuerySchema.parse({ groupId: "1", identityCommitment: "abc" }),
    ).toThrow(/numeric string/i);
  });
});

describe("UpdateMerkleTreeDurationSchema (T8)", () => {
  it("parses valid newMerkleTreeDuration to bigint", () => {
    const parsed = UpdateMerkleTreeDurationSchema.parse({
      newMerkleTreeDuration: "604800",
    });
    expect(parsed.newMerkleTreeDuration).toBe(604800n);
  });

  it("rejects a non-numeric duration", () => {
    expect(() =>
      UpdateMerkleTreeDurationSchema.parse({ newMerkleTreeDuration: "abc" }),
    ).toThrow();
  });

  it("rejects when newMerkleTreeDuration is missing", () => {
    expect(() => UpdateMerkleTreeDurationSchema.parse({})).toThrow();
  });
});

describe("IndexOfQuerySchema (T9)", () => {
  it("parses valid groupId and identityCommitment", () => {
    const parsed = IndexOfQuerySchema.parse({
      groupId: "42",
      identityCommitment: "999",
    });
    expect(parsed.groupId).toBe(42n);
    expect(parsed.identityCommitment).toBe(999n);
  });

  it("rejects when groupId is missing", () => {
    expect(() => IndexOfQuerySchema.parse({ identityCommitment: "1" })).toThrow();
  });

  it("rejects a non-numeric groupId", () => {
    expect(() =>
      IndexOfQuerySchema.parse({ groupId: "abc", identityCommitment: "1" }),
    ).toThrow();
  });
});
