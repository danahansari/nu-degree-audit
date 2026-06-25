import { describe, expect, it } from "vitest";

import {
  isApprovedBasicScienceCourse,
  isBasicScienceLabCourse,
} from "./basicScienceCourses";

describe("basicScienceCourses", () => {
  it("recognizes approved lecture courses", () => {
    expect(isApprovedBasicScienceCourse("PHYSICS 135-2")).toBe(true);
    expect(isApprovedBasicScienceCourse("CHEM 131-0")).toBe(true);
    expect(isApprovedBasicScienceCourse("BIOL_SCI 202-0")).toBe(true);
    expect(isApprovedBasicScienceCourse("PSYCH 221-0")).toBe(true);
  });

  it("recognizes physics alternatives", () => {
    expect(isApprovedBasicScienceCourse("PHYSICS 125-2")).toBe(true);
    expect(isApprovedBasicScienceCourse("PHYSICS 140-3")).toBe(true);
  });

  it("recognizes AP chemistry placeholders", () => {
    for (const code of ["CHEM 1X0", "CHEM 1X1", "CHEM 1X2", "CHEM 11X", "CHEM 12X"]) {
      expect(isApprovedBasicScienceCourse(code)).toBe(true);
    }
  });

  it("rejects non-basic-science courses", () => {
    expect(isApprovedBasicScienceCourse("PERF_ST 103-0")).toBe(false);
    expect(isApprovedBasicScienceCourse("COMP_SCI 211-0")).toBe(false);
  });

  it("identifies lab courses", () => {
    expect(isBasicScienceLabCourse("PHYSICS 136-2")).toBe(true);
    expect(isBasicScienceLabCourse("PHYSICS 135-2")).toBe(false);
  });
});
