import type { CourseAllocationMap } from "./types";

import { AUTO_ALLOCATION } from "./allocationTargets";

export const COURSE_ALLOCATIONS_KEY = "courseAllocations";

/** Normalize legacy single-string allocations from sessionStorage. */
export function normalizeAllocations(
  raw: Record<string, string | string[] | undefined>,
): CourseAllocationMap {
  const result: CourseAllocationMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value) continue;
    const ids = (Array.isArray(value) ? value : [value]).filter(
      (id) => id && id !== AUTO_ALLOCATION,
    );
    if (ids.length > 0) result[key] = ids;
  }
  return result;
}

export function loadAllocations(): CourseAllocationMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(COURSE_ALLOCATIONS_KEY);
    if (!raw) return {};
    return normalizeAllocations(JSON.parse(raw) as Record<string, string | string[]>);
  } catch {
    return {};
  }
}

export function saveAllocations(allocations: CourseAllocationMap): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(COURSE_ALLOCATIONS_KEY, JSON.stringify(allocations));
}

export function clearAllocations(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COURSE_ALLOCATIONS_KEY);
}

export function allocationIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((id, i) => id === sortedB[i]);
}
