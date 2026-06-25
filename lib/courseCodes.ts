export function normalizeCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "";

  const cleaned = trimmed.replace(/[_\s]+/g, " ").toUpperCase();
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length === 0) return "";

  const last = parts[parts.length - 1];
  const looksLikeNumber = /^\d{3}(?:-\d{1,2})?$/.test(last);

  if (looksLikeNumber && parts.length >= 2) {
    const subject = parts.slice(0, -1).join("_").replace(/_+/g, "_");
    return `${subject} ${last}`;
  }

  return parts.join(" ");
}

export function makeCourseKey(course: { code: string; term: string; grade: string }): string {
  return `${normalizeCode(course.code)}|${course.term}|${course.grade}`;
}

export function isApCreditCourse(course: { term: string; grade: string }): boolean {
  return course.term === "AP Credit" || course.grade === "AP";
}
