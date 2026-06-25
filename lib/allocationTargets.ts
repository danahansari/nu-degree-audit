export const AUTO_ALLOCATION = "auto";

export interface AllocationTarget {
  id: string;
  label: string;
  group: string;
}

export const ALLOCATION_TARGETS: AllocationTarget[] = [
  { id: AUTO_ALLOCATION, label: "Automatic (recommended)", group: "" },
  { id: "mccormick-math", label: "Mathematics", group: "McCormick Core" },
  { id: "mccormick-basic-sciences", label: "Basic Sciences", group: "McCormick Core" },
  { id: "mccormick-ea", label: "Engineering Analysis", group: "McCormick Core" },
  { id: "mccormick-design-comm", label: "Design & Communications", group: "McCormick Core" },
  { id: "mccormick-ssh", label: "Social Sciences/Humanities", group: "McCormick Core" },
  { id: "mccormick-unrestricted", label: "Unrestricted Electives", group: "McCormick Core" },
  { id: "ee-required", label: "EE Required Courses", group: "EE Degree" },
  { id: "ee-technical-electives-tracks", label: "EE Technical Electives — Tracks", group: "EE Degree" },
  { id: "ee-technical-electives-300", label: "EE Technical Electives — 300/400 Level", group: "EE Degree" },
  { id: "ee-technical-electives-advanced", label: "EE Technical Electives — Advanced", group: "EE Degree" },
  { id: "ee-design", label: "EE Design Course", group: "EE Degree" },
  { id: "cs-minor-prereqs", label: "CS Minor Prerequisites", group: "CS Minor" },
  { id: "cs-minor-core", label: "CS Minor Core", group: "CS Minor" },
  { id: "cs-minor-theory", label: "CS Minor Breadth — Theory", group: "CS Minor" },
  { id: "cs-minor-systems", label: "CS Minor Breadth — Systems", group: "CS Minor" },
  { id: "cs-minor-ai", label: "CS Minor Breadth — AI", group: "CS Minor" },
  { id: "cs-minor-interfaces", label: "CS Minor Breadth — Interfaces", group: "CS Minor" },
  { id: "cs-minor-software", label: "CS Minor Breadth — Software", group: "CS Minor" },
];

export function getAllocationLabel(requirementId: string): string {
  return ALLOCATION_TARGETS.find((t) => t.id === requirementId)?.label ?? requirementId;
}

export const FLEXIBLE_REQUIREMENT_IDS = new Set(
  ALLOCATION_TARGETS.filter((t) => t.id !== AUTO_ALLOCATION).map((t) => t.id),
);

export const UNALLOCATED_SECTION = "__unallocated__";

export interface AllocationSectionStyle {
  label: string;
  headerBg: string;
  headerText: string;
  rowBorder: string;
  rowBg: string;
  dot: string;
}

const SECTION_STYLES: Record<string, AllocationSectionStyle> = {
  "mccormick-math": {
    label: "Mathematics",
    headerBg: "bg-orange-50",
    headerText: "text-orange-900",
    rowBorder: "border-orange-400",
    rowBg: "bg-orange-50/60",
    dot: "bg-orange-500",
  },
  "mccormick-basic-sciences": {
    label: "Basic Sciences",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-900",
    rowBorder: "border-emerald-400",
    rowBg: "bg-emerald-50/60",
    dot: "bg-emerald-500",
  },
  "mccormick-ea": {
    label: "Engineering Analysis",
    headerBg: "bg-amber-50",
    headerText: "text-amber-900",
    rowBorder: "border-amber-400",
    rowBg: "bg-amber-50/60",
    dot: "bg-amber-500",
  },
  "mccormick-design-comm": {
    label: "Design & Communications",
    headerBg: "bg-lime-50",
    headerText: "text-lime-900",
    rowBorder: "border-lime-500",
    rowBg: "bg-lime-50/60",
    dot: "bg-lime-600",
  },
  "mccormick-ssh": {
    label: "Social Sciences/Humanities",
    headerBg: "bg-violet-50",
    headerText: "text-violet-900",
    rowBorder: "border-violet-400",
    rowBg: "bg-violet-50/60",
    dot: "bg-violet-500",
  },
  "mccormick-unrestricted": {
    label: "Unrestricted Electives",
    headerBg: "bg-slate-100",
    headerText: "text-slate-800",
    rowBorder: "border-slate-400",
    rowBg: "bg-slate-50",
    dot: "bg-slate-500",
  },
  "ee-required": {
    label: "EE Required (ABET elective)",
    headerBg: "bg-purple-50",
    headerText: "text-purple-900",
    rowBorder: "border-purple-400",
    rowBg: "bg-purple-50/60",
    dot: "bg-purple-500",
  },
  "ee-technical-electives-tracks": {
    label: "EE Technical Electives — Tracks",
    headerBg: "bg-fuchsia-50",
    headerText: "text-fuchsia-900",
    rowBorder: "border-fuchsia-400",
    rowBg: "bg-fuchsia-50/60",
    dot: "bg-fuchsia-500",
  },
  "ee-technical-electives-300": {
    label: "EE Technical Electives — 300/400 Level",
    headerBg: "bg-pink-50",
    headerText: "text-pink-900",
    rowBorder: "border-pink-400",
    rowBg: "bg-pink-50/60",
    dot: "bg-pink-500",
  },
  "ee-technical-electives-advanced": {
    label: "EE Technical Electives — Advanced",
    headerBg: "bg-rose-50",
    headerText: "text-rose-900",
    rowBorder: "border-rose-400",
    rowBg: "bg-rose-50/60",
    dot: "bg-rose-500",
  },
  "ee-design": {
    label: "EE Design Course",
    headerBg: "bg-purple-50",
    headerText: "text-purple-900",
    rowBorder: "border-purple-500",
    rowBg: "bg-purple-50/60",
    dot: "bg-purple-600",
  },
  "cs-minor-prereqs": {
    label: "CS Minor Prerequisites",
    headerBg: "bg-indigo-50",
    headerText: "text-indigo-900",
    rowBorder: "border-indigo-300",
    rowBg: "bg-indigo-50/40",
    dot: "bg-indigo-400",
  },
  "cs-minor-core": {
    label: "CS Minor Core",
    headerBg: "bg-indigo-100",
    headerText: "text-indigo-950",
    rowBorder: "border-indigo-500",
    rowBg: "bg-indigo-50/80",
    dot: "bg-indigo-600",
  },
  "cs-minor-theory": {
    label: "CS Minor — Theory",
    headerBg: "bg-indigo-50",
    headerText: "text-indigo-900",
    rowBorder: "border-indigo-400",
    rowBg: "bg-indigo-50/60",
    dot: "bg-indigo-500",
  },
  "cs-minor-systems": {
    label: "CS Minor — Systems",
    headerBg: "bg-blue-50",
    headerText: "text-blue-900",
    rowBorder: "border-blue-400",
    rowBg: "bg-blue-50/60",
    dot: "bg-blue-500",
  },
  "cs-minor-ai": {
    label: "CS Minor — AI",
    headerBg: "bg-sky-50",
    headerText: "text-sky-900",
    rowBorder: "border-sky-400",
    rowBg: "bg-sky-50/60",
    dot: "bg-sky-500",
  },
  "cs-minor-interfaces": {
    label: "CS Minor — Interfaces",
    headerBg: "bg-cyan-50",
    headerText: "text-cyan-900",
    rowBorder: "border-cyan-400",
    rowBg: "bg-cyan-50/60",
    dot: "bg-cyan-500",
  },
  "cs-minor-software": {
    label: "CS Minor — Software",
    headerBg: "bg-teal-50",
    headerText: "text-teal-900",
    rowBorder: "border-teal-400",
    rowBg: "bg-teal-50/60",
    dot: "bg-teal-500",
  },
  [UNALLOCATED_SECTION]: {
    label: "Unallocated",
    headerBg: "bg-amber-50",
    headerText: "text-amber-900",
    rowBorder: "border-amber-400",
    rowBg: "bg-amber-50/40",
    dot: "bg-amber-500",
  },
};

export const ALLOCATION_SECTION_ORDER = [
  "mccormick-math",
  "mccormick-basic-sciences",
  "mccormick-ea",
  "mccormick-design-comm",
  "mccormick-ssh",
  "mccormick-unrestricted",
  "ee-required",
  "ee-technical-electives-tracks",
  "ee-technical-electives-300",
  "ee-technical-electives-advanced",
  "ee-design",
  "cs-minor-prereqs",
  "cs-minor-core",
  "cs-minor-theory",
  "cs-minor-systems",
  "cs-minor-ai",
  "cs-minor-interfaces",
  "cs-minor-software",
  UNALLOCATED_SECTION,
];

export function getAllocationSectionStyle(sectionId: string): AllocationSectionStyle {
  return (
    SECTION_STYLES[sectionId] ?? {
      label: getAllocationLabel(sectionId),
      headerBg: "bg-gray-100",
      headerText: "text-gray-800",
      rowBorder: "border-gray-400",
      rowBg: "bg-gray-50",
      dot: "bg-gray-500",
    }
  );
}

export function sectionOrderIndex(sectionId: string): number {
  const idx = ALLOCATION_SECTION_ORDER.indexOf(sectionId);
  return idx === -1 ? ALLOCATION_SECTION_ORDER.length : idx;
}
