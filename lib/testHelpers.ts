import type { ParsedCourse } from "./types";

export function makeCourse(
  code: string,
  overrides: Partial<ParsedCourse> = {},
): ParsedCourse {
  return {
    code,
    name: overrides.name ?? code,
    attempted: 1,
    earned: 1,
    grade: "A",
    term: "2024 Fall",
    status: "completed",
    ...overrides,
  };
}
