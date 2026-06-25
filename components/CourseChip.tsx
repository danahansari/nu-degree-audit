"use client";

interface CourseChipProps {
  code: string;
  name: string;
  status: "completed" | "in_progress" | "not_taken" | "transfer";
  units?: number;
  isDoubleCount?: boolean;
}

const STATUS_STYLES: Record<
  CourseChipProps["status"],
  { bg: string; text: string; border: string; icon: string }
> = {
  completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-400",
    icon: "✓",
  },
  in_progress: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-400",
    icon: "⟳",
  },
  not_taken: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-400",
    icon: "○",
  },
  transfer: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-400",
    icon: "✓",
  },
};

export function CourseChip({ code, name, status, units, isDoubleCount }: CourseChipProps) {
  const s = STATUS_STYLES[status];

  return (
    <div
      className={[
        "inline-flex w-full max-w-full items-center gap-2 rounded-full px-3 py-1.5",
        s.bg,
        s.text,
        "border-l-4",
        s.border,
      ].join(" ")}
    >
      <span className="text-xs leading-none" aria-hidden="true">
        {s.icon}
      </span>

      <span className="min-w-0 truncate text-xs">
        <span className="font-mono font-bold">{code}</span>
        <span className="mx-1">—</span>
        <span className="font-body font-normal">{name}</span>
        {typeof units === "number" ? (
          <span className="ml-2 text-[11px] text-gray-600">{`(${units} unit)`}</span>
        ) : null}
      </span>

      {isDoubleCount ? (
        <span className="ml-1 inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-[#4E2A84]">
          2×
        </span>
      ) : null}
    </div>
  );
}

