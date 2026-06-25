import { readFile } from "node:fs/promises";

import { parseCourses } from "../lib/claudeParser.ts";

async function main() {
  const textPath = process.argv[2];

  if (!textPath) {
    console.error(
      "Usage: npx ts-node --project tsconfig.json scripts/test-claude.ts path/to/transcript.txt",
    );
    process.exit(1);
  }

  const transcriptText = await readFile(textPath, "utf8");
  const courses = await parseCourses(transcriptText);

  for (const c of courses) {
    console.log(
      `[${String(c.status).toUpperCase()}] ${c.code} — ${c.name} (attempted: ${c.attempted}, earned: ${c.earned}, grade: ${c.grade})`,
    );
  }

  console.log(`\nTotal courses: ${courses.length}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

