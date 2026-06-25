import { describe, expect, it } from "vitest";

import {
  apSelectionsToCourses,
  getApExamById,
  mergeTranscriptAndApCredits,
} from "./apCredits";
import { makeCourseKey } from "./courseCodes";
import { makeCourse } from "./testHelpers";

describe("apCredits", () => {
  it("converts AP Chemistry score 5 to full Northwestern credit set", () => {
    const courses = apSelectionsToCourses([{ examId: "chemistry", score: 5 }]);
    expect(courses).toHaveLength(5);
    expect(courses.map((c) => ({ code: c.code, units: c.attempted }))).toEqual([
      { code: "CHEM 1X1", units: 1 },
      { code: "CHEM 11X", units: 0.33 },
      { code: "CHEM 1X0", units: 1 },
      { code: "CHEM 1X2", units: 1 },
      { code: "CHEM 12X", units: 0.33 },
    ]);
    expect(courses[0].status).toBe("transfer");
    expect(courses[0].grade).toBe("AP");
    expect(courses[0].term).toBe("AP Credit");
  });

  it("converts AP Statistics selection to STAT 210-0", () => {
    const courses = apSelectionsToCourses([{ examId: "statistics", score: 5 }]);
    expect(courses[0]?.code).toBe("STAT 210-0");
  });

  it("merges AP courses without duplicating transcript codes", () => {
    const transcript = [makeCourse("COMP_SCI 211-0")];
    const ap = apSelectionsToCourses([{ examId: "chemistry", score: 5 }]);
    const merged = mergeTranscriptAndApCredits(transcript, ap);
    expect(merged).toHaveLength(6);
  });

  it("skips duplicate codes already on transcript", () => {
    const transcript = [makeCourse("STAT 210-0")];
    const ap = apSelectionsToCourses([{ examId: "statistics", score: 5 }]);
    const merged = mergeTranscriptAndApCredits(transcript, ap);
    expect(merged).toHaveLength(1);
  });

  it("has chemistry exam in catalog", () => {
    const exam = getApExamById("chemistry");
    expect(exam?.exam).toBe("Chemistry");
    expect(exam?.defaultAllocations).toContain("mccormick-basic-sciences");
  });
});

describe("makeCourseKey", () => {
  it("builds stable keys for AP courses", () => {
    const c = apSelectionsToCourses([{ examId: "chemistry", score: 5 }])[0];
    expect(makeCourseKey(c)).toBe("CHEM 1X1|AP Credit|AP");
  });
});
