"use client";

import { useMemo, useState } from "react";

import type { MatchedRequirement } from "@/lib/types";
import { RequirementSection } from "@/components/RequirementSection";

interface DashboardTabsProps {
  coreRequirements: MatchedRequirement[];
  eeRequirements: MatchedRequirement[];
  csRequirements: MatchedRequirement[];
}

type TabId = "core" | "ee" | "cs";

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

export function DashboardTabs({ coreRequirements, eeRequirements, csRequirements }: DashboardTabsProps) {
  const [active, setActive] = useState<TabId>("core");

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

  const eeOrdered = useMemo(() => {
    const order = [
      "ee-required",
      "ee-technical-electives-tracks",
      "ee-technical-electives-300",
      "ee-technical-electives-advanced",
      "ee-design",
    ];

    const byId = new Map(eeRequirements.map((r) => [r.id, r]));
    const list: MatchedRequirement[] = [];
    for (const id of order) {
      const r = byId.get(id);
      if (r) list.push(r);
    }
    for (const r of eeRequirements) {
      if (!order.includes(r.id)) list.push(r);
    }
    return list;
  }, [eeRequirements]);

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
          <TabButton active={active === "core"} onClick={() => setActive("core")}>
            McCormick Core
          </TabButton>
          <TabButton active={active === "ee"} onClick={() => setActive("ee")}>
            EE Degree
          </TabButton>
          <TabButton active={active === "cs"} onClick={() => setActive("cs")}>
            CS Minor
          </TabButton>
        </div>
      </div>

      {active === "core" ? (
        <div className="mt-6 space-y-3">
          {coreRequirements.map((r) => (
            <RequirementSection key={r.id} requirement={r} />
          ))}
        </div>
      ) : null}

      {active === "ee" ? (
        <div className="mt-6 space-y-3">
          {eeOrdered.map((r) => (
            <RequirementSection key={r.id} requirement={r} />
          ))}
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
    </div>
  );
}
