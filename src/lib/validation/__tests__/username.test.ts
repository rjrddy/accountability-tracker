import { describe, expect, it } from "vitest";
import { normalizeUsername, validateUsername } from "@/lib/validation/username";

describe("username validation", () => {
  it("normalizes username to lowercase and trims whitespace", () => {
    expect(normalizeUsername("  My_Name  ")).toBe("my_name");
  });

  it("accepts valid usernames", () => {
    expect(validateUsername("abc")).toBeNull();
    expect(validateUsername("abc_123")).toBeNull();
    expect(validateUsername("ABCDEFGHIJKLMNOPQRST")).toBeNull();
  });

  it("rejects invalid usernames", () => {
    expect(validateUsername("ab")).toBeTruthy();
    expect(validateUsername("a b c")).toBeTruthy();
    expect(validateUsername("abc-123")).toBeTruthy();
    expect(validateUsername("this_username_is_far_too_long")).toBeTruthy();
  });
});
