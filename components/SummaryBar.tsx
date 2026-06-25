"use client";

interface SummaryBarProps {
  studentName: string;
  gpa: string;
  eeCompleted: number; // units completed toward EE (48 total)
  csCompleted: number; // units completed toward CS Minor (9 total)
  eeInProgress: number;
  csInProgress: number;
}

function firstNameFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "there";

  // Handle "Lastname, Firstname" and "Firstname Lastname"
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    const first = parts[1]?.split(/\s+/)[0];
    return first || trimmed;
  }

  return trimmed.split(/\s+/)[0] || trimmed;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function MiniProgress({
  label,
  completed,
  inProgress,
  total,
}: {
  label: string;
  completed: number;
  inProgress: number;
  total: number;
}) {
  const c = clamp(completed, 0, total);
  const ip = clamp(inProgress, 0, total - c);
  const pctC = total > 0 ? (c / total) * 100 : 0;
  const pctIP = total > 0 ? (ip / total) * 100 : 0;

  return (
    <div className="min-w-[220px]">
      <div className="text-xs font-semibold text-white/90">
        {label} <span className="font-normal text-white/80">{`${c.toFixed(1)} / ${total} units`}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/30">
        <div className="flex h-full">
          <div className="h-full bg-white/90" style={{ width: `${pctC}%` }} />
          <div className="h-full bg-white/60" style={{ width: `${pctIP}%` }} />
        </div>
      </div>
    </div>
  );
}

export function SummaryBar({
  studentName,
  gpa,
  eeCompleted,
  csCompleted,
  eeInProgress,
  csInProgress,
}: SummaryBarProps) {
  const firstName = firstNameFromDisplayName(studentName);

  return (
    <div className="sticky top-0 z-20 w-full bg-[#4E2A84] text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="font-display text-base font-bold text-white">{`Hi, ${firstName}!`}</div>
          <div className="text-sm text-white/85">{gpa ? `GPA: ${gpa}` : "GPA: —"}</div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <MiniProgress
            label="B.S. Electrical Engineering"
            completed={eeCompleted}
            inProgress={eeInProgress}
            total={48}
          />
          <MiniProgress label="CS Minor" completed={csCompleted} inProgress={csInProgress} total={9} />
        </div>

        <div className="text-sm font-semibold text-white/85 md:text-right">Class of 2028</div>
      </div>
    </div>
  );
}

