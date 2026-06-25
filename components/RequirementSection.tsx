"use client";

import { useMemo, useState } from "react";

import type { MatchedRequirement } from "@/lib/types";
import { CourseChip } from "@/components/CourseChip";

interface RequirementSectionProps {
  requirement: MatchedRequirement;
}

function degreeBadge(degree: MatchedRequirement["degree"]) {
  if (degree === "EE") {
    return { label: "EE", className: "bg-[#4E2A84]/10 text-[#4E2A84]" };
  }
  if (degree === "CS_MINOR") {
    return { label: "CS Minor", className: "bg-indigo-100 text-indigo-800" };
  }
  return { label: "McCormick Core", className: "bg-slate-100 text-slate-800" };
}

export function RequirementSection({ requirement }: RequirementSectionProps) {
  const defaultCollapsed = requirement.id === "cs-minor-prereqs";
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const total = requirement.totalUnits || 0;
  const completed = requirement.completedUnits || 0;
  const inProgress = requirement.inProgressUnits || 0;
  const pctCompleted = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  const pctInProgress =
    total > 0 ? Math.min(100 - pctCompleted, (inProgress / total) * 100) : 0;
  const isComplete = total > 0 && completed >= total;
  const hasOverflow = total > 0 && completed > total;

  const badge = degreeBadge(requirement.degree);

  const { matchedChips, unmetChips } = useMemo(() => {
    const matched = requirement.matchedCourses
      .slice()
      .sort((a, b) => {
        const rank = (s: string) =>
          s === "completed" ? 0 : s === "transfer" ? 1 : s === "in_progress" ? 2 : 3;
        return rank(a.course.status) - rank(b.course.status);
      })
      .map((m) => ({
        key: `${m.course.code}|${m.course.term}|${m.course.grade}|${m.requirementCourseCode}`,
        code: m.course.code,
        name: m.course.name,
        status: m.course.status,
        units: m.course.attempted,
      }));

    const unmet = requirement.unmetCourses.map((c, idx) => ({
      key: `${c.code || "ELECTIVE"}|${idx}`,
      code: c.code?.trim() ? c.code : "ELECTIVE",
      name: c.code?.trim()
        ? c.name
        : c.electiveDescription || c.name || "Elective",
      status: "not_taken" as const,
      units: c.units,
    }));

    return { matchedChips: matched, unmetChips: unmet };
  }, [requirement]);

  const isEmpty = matchedChips.length === 0 && unmetChips.length === 0;

  return (
    <section
      className={[
        "rounded-2xl border",
        isComplete ? "border-green-200 bg-green-50/60" : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-heading truncate text-base font-bold text-gray-900">
              {requirement.category} {isComplete ? <span className="ml-1">✅</span> : null}
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          {requirement.description ? (
            <div className="mt-1 text-xs text-gray-500">{requirement.description}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-gray-600">
            {completed.toFixed(1)} / {total.toFixed(1)} units
            {hasOverflow ? <span className="ml-1 text-green-700">(extra credit)</span> : null}
          </div>
          <div className="text-gray-500">{collapsed ? "▼" : "▲"}</div>
        </div>
      </button>

      <div className="px-5 pb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="flex h-full">
            <div className="h-full bg-green-500" style={{ width: `${pctCompleted}%` }} />
            <div className="h-full bg-yellow-400" style={{ width: `${pctInProgress}%` }} />
          </div>
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          {completed.toFixed(1)} completed{inProgress > 0 ? ` • ${inProgress.toFixed(1)} in progress` : ""}
        </div>
      </div>

      {!collapsed ? (
        <div className="space-y-3 border-t border-gray-200 px-5 py-4">
          {isEmpty ? (
            <div className="text-sm text-gray-500">No courses in this category yet</div>
          ) : null}
          <div className="flex flex-col gap-2">
            {matchedChips.map((c) => (
              <CourseChip
                key={c.key}
                code={c.code}
                name={c.name}
                status={c.status as any}
                units={c.units}
              />
            ))}
          </div>

          {unmetChips.length > 0 ? (
            <div className="flex flex-col gap-2">
              {unmetChips.map((c) => (
                <CourseChip
                  key={c.key}
                  code={c.code}
                  name={c.name}
                  status={c.status}
                  units={c.units}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

