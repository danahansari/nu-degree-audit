import { describe, expect, it } from "vitest";

import { computeAudit, findExactMatch, getProgressSummary } from "./matchCourses";
import { getAllRequirements } from "./requirements";
import { makeCourse } from "./testHelpers";

const requirements = getAllRequirements();

function req(id: string) {
  const r = requirements.find((x) => x.id === id);
  if (!r) throw new Error(`Missing requirement: ${id}`);
  return r;
}

function audit(courses: ReturnType<typeof makeCourse>[]) {
  return computeAudit(courses, requirements);
}

function matchedCodes(resultId: string, courses: ReturnType<typeof makeCourse>[]) {
  const r = audit(courses).find((x) => x.id === resultId);
  return r?.matchedCourses.map((m) => m.course.code) ?? [];
}

describe("findExactMatch", () => {
  it("matches engineering analysis honors alternative", () => {
    const ea = req("mccormick-ea");
    expect(findExactMatch("GEN_ENG 206-1", ea)?.code).toBe("GEN_ENG 205-1");
    expect(findExactMatch("GEN_ENG 206-4", ea)?.code).toBe("GEN_ENG 205-4");
  });

  it("matches design elective alternatives", () => {
    const design = req("mccormick-design-comm");
    expect(findExactMatch("PERF_ST 103-0", design)?.code).toBe("COMM_ST 102-0");
  });
});

describe("computeAudit", () => {
  it("assigns PERF_ST 103-0 to design and communications, not SSH", () => {
    const courses = [makeCourse("PERF_ST 103-0", { name: "Analysis and Performance of Literature" })];
    const results = audit(courses);

    const design = results.find((r) => r.id === "mccormick-design-comm");
    const ssh = results.find((r) => r.id === "mccormick-ssh");

    expect(design?.matchedCourses.some((m) => m.course.code === "PERF_ST 103-0")).toBe(true);
    expect(ssh?.matchedCourses.some((m) => m.course.code === "PERF_ST 103-0")).toBe(false);
  });

  it("assigns physics sequence to basic sciences", () => {
    const courses = [
      makeCourse("PHYSICS 135-2"),
      makeCourse("PHYSICS 136-2", { attempted: 0.33, earned: 0.33 }),
      makeCourse("PHYSICS 135-3", { term: "2025 Winter" }),
      makeCourse("PHYSICS 136-3", { attempted: 0.33, earned: 0.33, term: "2025 Winter" }),
    ];

    const basic = audit(courses).find((r) => r.id === "mccormick-basic-sciences");
    expect(basic?.completedUnits).toBeCloseTo(2.66, 2);
    expect(matchedCodes("mccormick-basic-sciences", courses)).toEqual(
      expect.arrayContaining(["PHYSICS 135-2", "PHYSICS 136-2", "PHYSICS 135-3", "PHYSICS 136-3"]),
    );
  });

  it("requires 1.33 additional basic science units beyond physics sequence", () => {
    const req = requirements.find((r) => r.id === "mccormick-basic-sciences");
    const elective = req?.courses.find((c) => c.isElective);
    expect(elective?.units).toBe(1.33);

    const physicsOnly = [
      makeCourse("PHYSICS 135-2"),
      makeCourse("PHYSICS 136-2", { attempted: 0.33, earned: 0.33 }),
      makeCourse("PHYSICS 135-3", { term: "2025 Winter" }),
      makeCourse("PHYSICS 136-3", { attempted: 0.33, earned: 0.33, term: "2025 Winter" }),
    ];
    const basic = audit(physicsOnly).find((r) => r.id === "mccormick-basic-sciences");
    expect(basic?.completedUnits).toBeCloseTo(2.66, 2);
    expect(basic?.unmetCourses.length).toBe(1);
  });

  it("does not double-count a course in basic sciences and unrestricted electives", () => {
    const courses = [
      makeCourse("PHYSICS 135-2"),
      makeCourse("PHYSICS 136-2", { attempted: 0.33, earned: 0.33 }),
      makeCourse("PHYSICS 135-3", { term: "2025 Winter" }),
      makeCourse("PHYSICS 136-3", { attempted: 0.33, earned: 0.33, term: "2025 Winter" }),
      makeCourse("CHEM 131-0", { term: "2023 Fall" }),
      makeCourse("CHEM 141-0", { attempted: 0, earned: 0, term: "2023 Fall" }),
    ];

    const results = audit(courses);
    const basic = results.find((r) => r.id === "mccormick-basic-sciences");
    const unrestricted = results.find((r) => r.id === "mccormick-unrestricted");

    const basicCodes = new Set(basic?.matchedCourses.map((m) => m.course.code));
    const unrestrictedCodes = unrestricted?.matchedCourses.map((m) => m.course.code) ?? [];

    for (const code of unrestrictedCodes) {
      expect(basicCodes.has(code)).toBe(false);
    }
  });

  it("fills SSH with non-engineering courses", () => {
    const courses = [makeCourse("HISTORY 101-0", { name: "Intro to History" })];
    expect(matchedCodes("mccormick-ssh", courses)).toContain("HISTORY 101-0");
  });

  it("includes mccormick core requirements in progress summary", () => {
    const courses = [
      makeCourse("MATH 220-1"),
      makeCourse("MATH 220-2", { term: "2025 Winter" }),
      makeCourse("MATH 228-1", { term: "2026 Fall" }),
      makeCourse("MATH 228-2", { term: "2026 Winter" }),
    ];

    const summary = getProgressSummary(audit(courses));
    expect(summary.eeCompleted).toBe(4);
  });
});

describe("requirements data", () => {
  it("has consolidated basic sciences requirement", () => {
    expect(requirements.some((r) => r.id === "mccormick-basic-sciences")).toBe(true);
    expect(requirements.some((r) => r.id === "mccormick-physics")).toBe(false);
    expect(requirements.some((r) => r.id === "mccormick-science-elective")).toBe(false);
  });

  it("has full EE degree requirement sections", () => {
    const eeIds = requirements.filter((r) => r.degree === "EE").map((r) => r.id);
    expect(eeIds).toEqual(
      expect.arrayContaining([
        "ee-required",
        "ee-technical-electives-tracks",
        "ee-technical-electives-300",
        "ee-technical-electives-advanced",
        "ee-design",
      ]),
    );
    expect(requirements.find((r) => r.id === "ee-required")?.totalUnits).toBe(10);
  });
});

describe("EE degree audit", () => {
  it("matches required EE core courses", () => {
    const courses = [
      makeCourse("COMP_ENG 203-0"),
      makeCourse("COMP_SCI 211-0", { term: "2023 Winter" }),
      makeCourse("ELEC_ENG 202-0", { term: "2024 Fall" }),
      makeCourse("ELEC_ENG 221-0", { term: "2024 Winter" }),
      makeCourse("ELEC_ENG 222-0", { term: "2025 Fall" }),
      makeCourse("ELEC_ENG 223-0", { term: "2025 Winter" }),
      makeCourse("ELEC_ENG 224-0", { term: "2026 Fall" }),
      makeCourse("ELEC_ENG 225-0", { term: "2026 Winter" }),
      makeCourse("ELEC_ENG 302-0", { term: "2027 Fall" }),
    ];

    const eeRequired = audit(courses).find((r) => r.id === "ee-required");
    expect(eeRequired?.completedUnits).toBe(9);
    expect(eeRequired?.unmetCourses.length).toBe(1);
  });

  it("fills EE track technical electives", () => {
    const courses = [makeCourse("ELEC_ENG 359-0", { name: "Digital Signal Processing" })];
    expect(matchedCodes("ee-technical-electives-tracks", courses)).toContain("ELEC_ENG 359-0");
  });

  it("matches EE design course alternatives", () => {
    const courses = [makeCourse("ELEC_ENG 398-0", { name: "Electrical Engineering Design" })];
    const design = audit(courses).find((r) => r.id === "ee-design");
    expect(design?.matchedCourses.some((m) => m.course.code === "ELEC_ENG 398-0")).toBe(true);
  });
});
