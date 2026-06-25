"use client";

import { useMemo, useState } from "react";

import type { MatchedRequirement, ParsedCourse } from "@/lib/types";
import { RequirementSection } from "@/components/RequirementSection";
import { CourseChip } from "@/components/CourseChip";

interface DashboardTabsProps {
  eeRequirements: MatchedRequirement[]; // degree: "EE" or "MCCORMICK_CORE"
  csRequirements: MatchedRequirement[]; // degree: "CS_MINOR"
  doubleCounts: { course: ParsedCourse; satisfiesIds: string[]; satisfiesNames: string[] }[];
}

type TabId = "ee" | "cs" | "double";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "font-heading px-4 py-3 text-sm font-semibold transition",
        active ? "border-b-2 border-[#4E2A84] text-[#4E2A84]" : "text-gray-500 hover:text-gray-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function DashboardTabs({ eeRequirements, csRequirements, doubleCounts }: DashboardTabsProps) {
  const [active, setActive] = useState<TabId>("ee");

  const { coreReqs, eeReqs } = useMemo(() => {
    return {
      coreReqs: eeRequirements.filter((r) => r.degree === "MCCORMICK_CORE"),
      eeReqs: eeRequirements.filter((r) => r.degree === "EE"),
    };
  }, [eeRequirements]);

  const csById = useMemo(() => {
    const map = new Map<string, MatchedRequirement>();
    for (const r of csRequirements) map.set(r.id, r);
    return map;
  }, [csRequirements]);

  const csOrdered = useMemo(() => {
    const order = [
      "cs-minor-prereqs",
      "cs-minor-core",
      "cs-minor-theory",
      "cs-minor-systems",
      "cs-minor-ai",
      "cs-minor-interfaces",
      "cs-minor-software",
    ];

    const list: MatchedRequirement[] = [];
    for (const id of order) {
      const r = csById.get(id);
      if (r) list.push(r);
    }
    for (const r of csRequirements) {
      if (!order.includes(r.id)) list.push(r);
    }
    return list;
  }, [csById, csRequirements]);

  const breadthCompletedAreas = useMemo(() => {
    const breadthIds = new Set([
      "cs-minor-theory",
      "cs-minor-systems",
      "cs-minor-ai",
      "cs-minor-interfaces",
      "cs-minor-software",
    ]);
    let count = 0;
    for (const r of csRequirements) {
      if (!breadthIds.has(r.id)) continue;
      if ((r.completedUnits ?? 0) >= 1) count++;
    }
    return count;
  }, [csRequirements]);

  const breadthBanner = useMemo(() => {
    const x = breadthCompletedAreas;
    if (x >= 3) return { className: "border-green-200 bg-green-50 text-green-900", emoji: "💡" };
    if (x === 2) return { className: "border-yellow-200 bg-yellow-50 text-yellow-900", emoji: "💡" };
    return { className: "border-red-200 bg-red-50 text-red-900", emoji: "💡" };
  }, [breadthCompletedAreas]);

  return (
    <div>
      <div className="sticky top-16 z-10 border-b border-gray-200 bg-white">
        <div className="flex">
          <TabButton active={active === "ee"} onClick={() => setActive("ee")}>
            EE Degree
          </TabButton>
          <TabButton active={active === "cs"} onClick={() => setActive("cs")}>
            CS Minor
          </TabButton>
          <TabButton active={active === "double"} onClick={() => setActive("double")}>
            Double-Counts
          </TabButton>
        </div>
      </div>

      {active === "ee" ? (
        <div className="mt-6 space-y-8">
          <div>
            <div className="font-heading text-sm font-bold text-gray-900">McCormick School Requirements</div>
            <div className="mt-3 space-y-3">
              {coreReqs.map((r) => (
                <RequirementSection key={r.id} requirement={r} />
              ))}
            </div>
          </div>

          <div>
            <div className="font-heading text-sm font-bold text-gray-900">Electrical Engineering Requirements</div>
            <div className="mt-3 space-y-3">
              {eeReqs.map((r) => (
                <RequirementSection key={r.id} requirement={r} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {active === "cs" ? (
        <div className="mt-6 space-y-4">
          <div className={`rounded-xl border p-4 text-sm ${breadthBanner.className}`}>
            {breadthBanner.emoji} You need breadth courses in <span className="font-semibold">3 of 5</span> areas.
            {" "}
            Currently completed: <span className="font-semibold">{breadthCompletedAreas}</span> areas.
          </div>

          <div className="space-y-3">
            {csOrdered.map((r) => (
              <RequirementSection key={r.id} requirement={r} />
            ))}
          </div>
        </div>
      ) : null}

      {active === "double" ? (
        <div className="mt-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Double-count courses</div>
            <div className="mt-1">
              These courses satisfy requirements in both your EE degree and CS minor, saving you time.
            </div>
          </div>

          {doubleCounts.length === 0 ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
              No double-count courses yet — they'll appear here as you complete more requirements.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {doubleCounts.map((d) => (
                <div
                  key={`${d.course.code}|${d.course.term}|${d.course.grade}`}
                  className="rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-2">
                    <CourseChip
                      code={d.course.code}
                      name={d.course.name}
                      status={d.course.status as any}
                      units={d.course.attempted}
                      isDoubleCount={true}
                    />
                    <div className="flex flex-wrap gap-2">
                      {d.satisfiesNames.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

