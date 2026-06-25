import { describe, expect, it } from "vitest";

import { normalizeCode } from "./courseCodes";

describe("normalizeCode", () => {
  it("uppercases and normalizes underscores", () => {
    expect(normalizeCode("comp_sci 111-0")).toBe("COMP_SCI 111-0");
    expect(normalizeCode("COMP_SCI_111-0")).toBe("COMP_SCI 111-0");
  });

  it("handles multi-word subjects", () => {
    expect(normalizeCode("perf_st 103-0")).toBe("PERF_ST 103-0");
    expect(normalizeCode("GEN_ENG 205-1")).toBe("GEN_ENG 205-1");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeCode("")).toBe("");
    expect(normalizeCode("   ")).toBe("");
  });
});
