import type { CourseAllocationMap, MatchedRequirement, ParsedCourse, Requirement, RequirementCourse } from "./types";
import { AUTO_ALLOCATION } from "./allocationTargets";
import { isApprovedBasicScienceCourse, isBasicScienceLabCourse } from "./basicScienceCourses";
import {
  isAbetEngineeringTopicsCourse,
  isEe300LevelCeeElective,
  isEeAdvancedTechnicalElective,
  isEeDesignCourse,
  isEeTrackTechnicalElective,
} from "./eeTechnicalElectives";
import { makeCourseKey, normalizeCode } from "./courseCodes";

export { normalizeCode, makeCourseKey };

export function findExactMatch(
  courseCode: string,
  requirement: Requirement,
): RequirementCourse | null {
  const normalized = normalizeCode(courseCode);
  if (!normalized) return null;

  for (const reqCourse of requirement.courses) {
    const codesToMatch = new Set<string>();

    const reqCode = normalizeCode(reqCourse.code);
    if (reqCode) codesToMatch.add(reqCode);

    for (const alt of reqCourse.alternatives ?? []) {
      const altCode = normalizeCode(alt);
      if (altCode) codesToMatch.add(altCode);
    }

    // Alternatives should match in either direction: if the student's course is the primary
    // or one of the allowed alternatives, it satisfies this slot.
    if (codesToMatch.has(normalized)) return reqCourse;
  }

  return null;
}

export function getMatchingRequirements(courseCode: string, requirements: Requirement[]): string[] {
  const matches: string[] = [];
  for (const req of requirements) {
    if (findExactMatch(courseCode, req)) matches.push(req.id);
  }
  return matches;
}

function statusRankForElectives(status: ParsedCourse["status"]): number {
  // Requirement: completed first, then in_progress, then transfer
  if (status === "completed") return 0;
  if (status === "in_progress") return 1;
  return 2; // transfer
}

function statusRankForSpecific(status: ParsedCourse["status"]): number {
  // Prefer truly completed credit if multiple attempts exist
  if (status === "completed") return 0;
  if (status === "transfer") return 1;
  return 2; // in_progress
}

function isNonEngineeringForSsh(code: string): boolean {
  const subject = normalizeCode(code).split(" ")[0] ?? "";
  const engineeringish = new Set([
    "COMP_SCI",
    "ELEC_ENG",
    "COMP_ENG",
    "GEN_ENG",
    "DSGN",
    "MATH",
    "PHYSICS",
    "CHEM",
    "BIOL_SCI",
    "EARTH",
    "ASTRON",
    "MECH_ENG",
    "CIV_ENG",
    "CHEM_ENG",
    "IND_ENG",
    "MSE",
    "MAT_SCI",
    "STAT",
    "IEMS",
  ]);
  return subject.length > 0 && !engineeringish.has(subject);
}

function courseUnitsForRequirement(course: ParsedCourse): { completedUnits: number; inProgressUnits: number } {
  if (course.status === "in_progress") {
    return { completedUnits: 0, inProgressUnits: course.attempted || 0 };
  }
  if (course.status === "transfer") {
    // Important edge case: transfers count as completed credit, but often have earned=0.
    return { completedUnits: course.attempted || 0, inProgressUnits: 0 };
  }
  return { completedUnits: course.earned || 0, inProgressUnits: 0 };
}

function pickBestCourse(
  candidates: ParsedCourse[],
  ranker: (s: ParsedCourse["status"]) => number,
): ParsedCourse | undefined {
  return [...candidates].sort((a, b) => ranker(a.status) - ranker(b.status))[0];
}

function isEngineeringCourse(courseCode: string): boolean {
  const subject = normalizeCode(courseCode).split(" ")[0] ?? "";
  const engineeringish = new Set([
    "COMP_SCI",
    "ELEC_ENG",
    "COMP_ENG",
    "GEN_ENG",
    "DSGN",
    "MATH",
    "PHYSICS",
    "CHEM",
    "BIOL_SCI",
    "EARTH",
    "ASTRON",
    "MECH_ENG",
    "CIV_ENG",
    "CHEM_ENG",
    "IND_ENG",
    "MSE",
    "MAT_SCI",
    "STAT",
    "IEMS",
  ]);
  return subject.length > 0 && engineeringish.has(subject);
}

const DESIGN_COMM_ELECTIVES = new Set([
  "COMM_ST 102-0",
  "PERF_ST 103-0",
  "PERF_ST 203-0",
  "BMD_ENG 390-2",
]);

function shouldExcludeFromSsh(courseCode: string): boolean {
  const code = normalizeCode(courseCode);
  return (
    code.startsWith("DSGN 106-") ||
    code === "ENGLISH 106-1" ||
    code === "ENGLISH 106-2" ||
    DESIGN_COMM_ELECTIVES.has(code)
  );
}

export interface ComputeAuditOptions {
  allocations?: CourseAllocationMap;
}

function slotKeyFor(req: Requirement, reqCourse: RequirementCourse, idx: number): string {
  return reqCourse.code?.trim() ? reqCourse.code : `__ELECTIVE__:${req.id}:${idx}`;
}

function unitsMatchedToSlot(
  matchedCourses: { course: ParsedCourse; requirementCourseCode: string }[],
  slotKey: string,
): number {
  return matchedCourses
    .filter((m) => m.requirementCourseCode === slotKey)
    .reduce((sum, m) => {
      const u = courseUnitsForRequirement(m.course);
      return sum + u.completedUnits + u.inProgressUnits;
    }, 0);
}

export function computeAudit(
  courses: ParsedCourse[],
  requirements: Requirement[],
  options?: ComputeAuditOptions,
): MatchedRequirement[] {
  const allocations = options?.allocations ?? {};
  const pinnedKeys = new Set(
    Object.entries(allocations)
      .filter(([, reqIds]) => reqIds && reqIds.length > 0)
      .map(([key]) => key),
  );
  const normalizedToCourseInstances = new Map<string, ParsedCourse[]>();
  for (const c of courses) {
    const key = normalizeCode(c.code);
    if (!key) continue;
    const list = normalizedToCourseInstances.get(key) ?? [];
    list.push(c);
    normalizedToCourseInstances.set(key, list);
  }

  const courseByKey = new Map<string, ParsedCourse>();
  for (const c of courses) {
    courseByKey.set(makeCourseKey(c), c);
  }

  type Working = {
    requirement: Requirement;
    usedCourseKeys: Set<string>;
    satisfiedCourseCodes: Set<string>;
    completedUnits: number;
    inProgressUnits: number;
    electiveUnitsFilled: number;
    matchedCourses: MatchedRequirement["matchedCourses"];
  };

  const working: Working[] = requirements.map((requirement) => ({
    requirement,
    usedCourseKeys: new Set<string>(),
    satisfiedCourseCodes: new Set<string>(),
    completedUnits: 0,
    inProgressUnits: 0,
    electiveUnitsFilled: 0,
    matchedCourses: [],
  }));

  const addMatch = (w: Working, course: ParsedCourse, slotKey: string, reqCourse: RequirementCourse) => {
    const key = makeCourseKey(course);
    if (w.usedCourseKeys.has(key)) return;
    w.usedCourseKeys.add(key);

    const units = courseUnitsForRequirement(course);
    w.completedUnits += units.completedUnits;
    w.inProgressUnits += units.inProgressUnits;

    w.matchedCourses.push({
      course,
      requirementCourseCode: slotKey,
    });

    const normalizedReqCode = normalizeCode(reqCourse.code);
    if (normalizedReqCode) w.satisfiedCourseCodes.add(normalizedReqCode);
  };

  // Phase 1: exact-match requirements first (specific required courses only)
  for (const w of working) {
    for (const reqCourse of w.requirement.courses) {
      const isElectiveSlot = reqCourse.isElective || !reqCourse.code?.trim();
      if (isElectiveSlot) continue;

      const candidates: ParsedCourse[] = [];

      const primaryKey = normalizeCode(reqCourse.code);
      if (primaryKey) candidates.push(...(normalizedToCourseInstances.get(primaryKey) ?? []));

      for (const alt of reqCourse.alternatives ?? []) {
        const altKey = normalizeCode(alt);
        if (altKey) candidates.push(...(normalizedToCourseInstances.get(altKey) ?? []));
      }

      const filtered = candidates.filter((c) => !w.usedCourseKeys.has(makeCourseKey(c)));
      const best = pickBestCourse(filtered, statusRankForSpecific);
      if (best) addMatch(w, best, reqCourse.code, reqCourse);
    }
  }

  const usedSshCourseKeys = new Set<string>();
  const usedUnrestrictedCourseKeys = new Set<string>();
  const usedBasicScienceCourseKeys = new Set<string>();
  const usedEeTrackKeys = new Set<string>();
  const usedEe300Keys = new Set<string>();
  const usedEeAdvancedKeys = new Set<string>();
  const usedEeDesignKeys = new Set<string>();
  const usedEeAbetKeys = new Set<string>();
  const globallyUsedCourseKeys = new Set<string>();

  for (const w of working) {
    for (const key of w.usedCourseKeys) globallyUsedCourseKeys.add(key);
  }

  // Phase 1.5: apply user manual allocations (supports double-counting across requirements)
  for (const [courseKey, requirementIds] of Object.entries(allocations)) {
    if (!requirementIds?.length) continue;

    const course = courseByKey.get(courseKey);
    if (!course) continue;

    for (const requirementId of requirementIds) {
      if (!requirementId || requirementId === AUTO_ALLOCATION) continue;

      const w = working.find((x) => x.requirement.id === requirementId);
      if (!w) continue;
      if (w.usedCourseKeys.has(courseKey)) continue;

      let placed = false;

      // Try exact-match slots (e.g. COMP_SCI 211-0 in ee-required / cs-minor-core)
      for (const reqCourse of w.requirement.courses) {
        if (reqCourse.isElective || !reqCourse.code?.trim()) continue;
        if (w.satisfiedCourseCodes.has(normalizeCode(reqCourse.code))) continue;

        const codes = new Set([normalizeCode(reqCourse.code)]);
        for (const alt of reqCourse.alternatives ?? []) codes.add(normalizeCode(alt));
        if (!codes.has(normalizeCode(course.code))) continue;

        addMatch(w, course, reqCourse.code, reqCourse);
        globallyUsedCourseKeys.add(courseKey);
        placed = true;
        break;
      }

      if (placed) continue;

      // Elective slots
      const slots = w.requirement.courses
        .map((c, idx) => ({ c, idx }))
        .filter(({ c }) => c.isElective || !c.code?.trim());

      for (const { c: reqCourse, idx } of slots) {
        const slotKey = slotKeyFor(w.requirement, reqCourse, idx);
        addMatch(w, course, slotKey, reqCourse);
        globallyUsedCourseKeys.add(courseKey);
        placed = true;
        break;
      }
    }
  }

  const fillElectivesForRequirement = (
    requirementId: string,
    candidateFilter: (c: ParsedCourse) => boolean,
    usedWithinType: Set<string>,
  ) => {
    const w = working.find((x) => x.requirement.id === requirementId);
    if (!w) return;

    const slots = w.requirement.courses
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => c.isElective || !c.code?.trim());

    for (const { c: reqCourse, idx } of slots) {
      const slotUnits = reqCourse.units || 0;
      const slotKey =
        reqCourse.code?.trim() ? reqCourse.code : `__ELECTIVE__:${w.requirement.id}:${idx}`;

      while (true) {
        const remaining = w.requirement.totalUnits - w.completedUnits;
        if (remaining <= 0) break;

        const filledInSlot = unitsMatchedToSlot(w.matchedCourses, slotKey);
        if (slotUnits > 0 && filledInSlot >= slotUnits) break;

        const candidates = courses
          .filter((course) => !pinnedKeys.has(makeCourseKey(course)))
          .filter((course) => !globallyUsedCourseKeys.has(makeCourseKey(course)))
          .filter((course) => !w.usedCourseKeys.has(makeCourseKey(course)))
          .filter((course) => !usedWithinType.has(makeCourseKey(course)))
          .filter(candidateFilter)
          .filter((course) => {
            if (slotUnits <= 0) return true;
            const courseUnits =
              courseUnitsForRequirement(course).completedUnits +
              courseUnitsForRequirement(course).inProgressUnits;
            return filledInSlot + courseUnits <= slotUnits;
          });

        const best = pickBestCourse(candidates, statusRankForElectives);
        if (!best) break;

        usedWithinType.add(makeCourseKey(best));
        globallyUsedCourseKeys.add(makeCourseKey(best));
        addMatch(w, best, slotKey, reqCourse);
        w.electiveUnitsFilled += slotUnits;
      }
    }
  };

  // Phase 2: Basic science elective slots (approved list only)
  fillElectivesForRequirement(
    "mccormick-basic-sciences",
    (c) => isApprovedBasicScienceCourse(c.code) && !isBasicScienceLabCourse(c.code),
    usedBasicScienceCourseKeys,
  );

  // Phase 3: EE technical elective tracks (6 courses)
  fillElectivesForRequirement(
    "ee-technical-electives-tracks",
    (c) => isEeTrackTechnicalElective(c.code),
    usedEeTrackKeys,
  );

  // Phase 3.5: EE design course (1 course) — before 300-level bucket steals design-only courses
  fillElectivesForRequirement(
    "ee-design",
    (c) => isEeDesignCourse(c.code),
    usedEeDesignKeys,
  );

  // Phase 4: EE 300/400-level CS/ECE/CE electives (2 courses)
  fillElectivesForRequirement(
    "ee-technical-electives-300",
    (c) => isEe300LevelCeeElective(c.code),
    usedEe300Keys,
  );

  // Phase 5: EE advanced technical electives (2 courses)
  fillElectivesForRequirement(
    "ee-technical-electives-advanced",
    (c) => isEeAdvancedTechnicalElective(c.code),
    usedEeAdvancedKeys,
  );

  // Phase 6: EE ABET engineering topics elective (after other EE buckets)
  fillElectivesForRequirement(
    "ee-required",
    (c) => isAbetEngineeringTopicsCourse(c.code),
    usedEeAbetKeys,
  );

  // Phase 7: SS/H slots (non-engineering, unique within SS/H)
  fillElectivesForRequirement(
    "mccormick-ssh",
    (c) =>
      !isEngineeringCourse(c.code) &&
      !shouldExcludeFromSsh(c.code) &&
      (c.attempted || 0) >= 1,
    usedSshCourseKeys,
  );

  // Phase 8: Unrestricted electives last (anything remaining, unique within unrestricted)
  fillElectivesForRequirement("mccormick-unrestricted", () => true, usedUnrestrictedCourseKeys);

  return working.map((w) => {
    const unmetCourses = w.requirement.courses
      .map((reqCourse, idx) => ({ reqCourse, idx }))
      .filter(({ reqCourse, idx }) => {
        const isElectiveSlot = reqCourse.isElective || !reqCourse.code?.trim();
        if (isElectiveSlot) {
          const slotKey =
            reqCourse.code?.trim() ? reqCourse.code : `__ELECTIVE__:${w.requirement.id}:${idx}`;
          return !w.matchedCourses.some((m) => m.requirementCourseCode === slotKey);
        }
        return !w.satisfiedCourseCodes.has(normalizeCode(reqCourse.code));
      })
      .map(({ reqCourse }) => reqCourse);

    return {
      ...w.requirement,
      completedUnits: w.completedUnits,
      inProgressUnits: w.inProgressUnits,
      matchedCourses: w.matchedCourses,
      unmetCourses,
    };
  });
}

export function getCourseAssignmentIds(
  course: ParsedCourse,
  auditResults: MatchedRequirement[],
): string[] {
  const key = makeCourseKey(course);
  const ids: string[] = [];
  for (const req of auditResults) {
    for (const m of req.matchedCourses) {
      if (makeCourseKey(m.course) === key && !ids.includes(req.id)) {
        ids.push(req.id);
      }
    }
  }
  return ids;
}

export function getCourseAssignment(
  course: ParsedCourse,
  auditResults: MatchedRequirement[],
): { requirementId: string; label: string } | null {
  const ids = getCourseAssignmentIds(course, auditResults);
  if (ids.length === 0) return null;
  const req = auditResults.find((r) => r.id === ids[0]);
  return req ? { requirementId: req.id, label: req.category } : null;
}

export function getAllocatableCourses(courses: ParsedCourse[]): ParsedCourse[] {
  const seen = new Set<string>();
  return courses.filter((course) => {
    if (course.status === "not_taken") return false;
    const key = makeCourseKey(course);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getDoubleCounts(
  auditResults: MatchedRequirement[],
): { course: ParsedCourse; satisfiesIds: string[]; satisfiesNames: string[] }[] {
  const map = new Map<string, { course: ParsedCourse; ids: Set<string>; names: Set<string> }>();

  for (const req of auditResults) {
    for (const m of req.matchedCourses) {
      const key = makeCourseKey(m.course);
      const entry =
        map.get(key) ??
        (() => {
          const e = { course: m.course, ids: new Set<string>(), names: new Set<string>() };
          map.set(key, e);
          return e;
        })();

      entry.ids.add(req.id);
      entry.names.add(req.category);
    }
  }

  return [...map.values()]
    .filter((e) => e.ids.size >= 2)
    .map((e) => ({
      course: e.course,
      satisfiesIds: [...e.ids],
      satisfiesNames: [...e.names],
    }));
}

export function getProgressSummary(auditResults: MatchedRequirement[]): {
  eeCompleted: number;
  eeInProgress: number;
  eeTotal: number;
  csCompleted: number;
  csInProgress: number;
  csTotal: number;
} {
  const eeTotal = 48;
  const csTotal = 9;

  let eeCompleted = 0;
  let eeInProgress = 0;
  let csCompleted = 0;
  let csInProgress = 0;

  for (const r of auditResults) {
    if (r.degree === "EE" || r.degree === "MCCORMICK_CORE") {
      eeCompleted += r.completedUnits || 0;
      eeInProgress += r.inProgressUnits || 0;
    }

    if (r.degree === "CS_MINOR" && r.id !== "cs-minor-prereqs") {
      csCompleted += r.completedUnits || 0;
      csInProgress += r.inProgressUnits || 0;
    }
  }

  return {
    eeCompleted,
    eeInProgress,
    eeTotal,
    csCompleted,
    csInProgress,
    csTotal,
  };
}

