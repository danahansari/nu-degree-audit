const LEGEND_ITEMS = [
  {
    label: "Completed",
    swatch: "bg-green-100 border-green-400",
    icon: "✓",
  },
  {
    label: "In progress",
    swatch: "bg-yellow-100 border-yellow-400",
    icon: "⟳",
  },
  {
    label: "Transfer credit",
    swatch: "bg-blue-100 border-blue-400",
    icon: "✓",
  },
  {
    label: "Still needed",
    swatch: "bg-red-100 border-red-400",
    icon: "○",
  },
] as const;

export function CourseLegend() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold text-gray-700">Legend</div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="inline-flex items-center gap-2">
            <span
              className={[
                "inline-flex h-5 items-center rounded-full border-l-4 px-2 text-[10px] leading-none",
                item.swatch,
              ].join(" ")}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
        <div className="inline-flex items-center gap-2">
          <span
            className="inline-flex h-5 items-center rounded-full bg-white px-2 text-[10px] font-bold leading-none text-[#4E2A84] ring-1 ring-gray-200"
            aria-hidden="true"
          >
            2×
          </span>
          <span className="text-xs text-gray-600">Counts toward EE &amp; CS Minor</span>
        </div>
      </div>
    </div>
  );
}
