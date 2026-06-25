import apCreditJson from "../data/apCredit.json";

import { normalizeCode } from "./courseCodes";
import type { ApCreditExam, ApCreditSelection, ParsedCourse } from "./types";

const AP_TERM = "AP Credit";
const AP_GRADE = "AP";

const catalog = apCreditJson as unknown as ApCreditExam[];

export function getApExamCatalog(): ApCreditExam[] {
  return catalog;
}

export function getApExamById(examId: string): ApCreditExam | undefined {
  return catalog.find((e) => e.id === examId);
}

export function getValidScoresForExam(examId: string): number[] {
  const exam = getApExamById(examId);
  if (!exam) return [];
  const scores = new Set<number>();
  for (const opt of exam.scoreOptions) {
    for (let s = opt.minScore; s <= 5; s++) scores.add(s);
  }
  return [...scores].sort((a, b) => a - b);
}

function coursesForSelection(examId: string, score: number): ApCreditExam["scoreOptions"][0]["courses"] {
  const exam = getApExamById(examId);
  if (!exam) return [];

  const applicable = exam.scoreOptions
    .filter((opt) => score >= opt.minScore)
    .sort((a, b) => b.minScore - a.minScore);

  return applicable[0]?.courses ?? [];
}

export function apSelectionsToCourses(selections: ApCreditSelection[]): ParsedCourse[] {
  const courses: ParsedCourse[] = [];

  for (const sel of selections) {
    const defs = coursesForSelection(sel.examId, sel.score);
    const exam = getApExamById(sel.examId);
    if (!exam || defs.length === 0) continue;

    for (const def of defs) {
      courses.push({
        code: def.code,
        name: def.name || `AP ${exam.exam}`,
        attempted: def.units,
        earned: def.units,
        grade: AP_GRADE,
        term: AP_TERM,
        status: "transfer",
      });
    }
  }

  return courses;
}

export function mergeTranscriptAndApCredits(
  transcriptCourses: ParsedCourse[],
  apCourses: ParsedCourse[],
): ParsedCourse[] {
  const existingCodes = new Set(transcriptCourses.map((c) => normalizeCode(c.code)));
  const merged = [...transcriptCourses];

  for (const ap of apCourses) {
    const code = normalizeCode(ap.code);
    if (!code || existingCodes.has(code)) continue;
    existingCodes.add(code);
    merged.push(ap);
  }

  return merged;
}

export const AP_CREDIT_SELECTIONS_KEY = "apCreditSelections";

export function loadApCreditSelections(): ApCreditSelection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(AP_CREDIT_SELECTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApCreditSelection[];
  } catch {
    return [];
  }
}

export function saveApCreditSelections(selections: ApCreditSelection[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AP_CREDIT_SELECTIONS_KEY, JSON.stringify(selections));
}

export function getApCategories(): string[] {
  const cats = new Set(catalog.map((e) => e.category));
  const order = ["Mathematics", "Science", "Computer Science", "Social Sciences", "Humanities", "Languages"];
  return order.filter((c) => cats.has(c)).concat([...cats].filter((c) => !order.includes(c)));
}
