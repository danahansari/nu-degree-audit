const LINKS = [
  {
    label: "Electrical Engineering degree requirements",
    href: "https://catalogs.northwestern.edu/undergraduate/engineering-applied-science/electrical-computer-engineering/electrical-engineering-degree/",
  },
  {
    label: "Computer Science minor requirements",
    href: "https://catalogs.northwestern.edu/undergraduate/engineering-applied-science/computer-science/computer-science-minor/",
  },
  {
    label: "AP / IB / transfer credits",
    href: "https://www.mccormick.northwestern.edu/academics/undergraduate/admissions/transfer-ap-ib-credits.html",
  },
] as const;

export function CatalogLinks() {
  return (
    <div className="mt-10 border-t border-gray-200 pt-6">
      <div className="text-xs font-semibold text-gray-700">Official requirements</div>
      <ul className="mt-2 space-y-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#4E2A84] hover:underline"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
