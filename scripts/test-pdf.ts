import { readFile } from "node:fs/promises";

import { extractTextFromPDF } from "../lib/parsePDF.ts";

async function main() {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error("Usage: npx ts-node --project tsconfig.json scripts/test-pdf.ts path/to/file.pdf");
    process.exit(1);
  }

  const buffer = await readFile(pdfPath);
  const text = await extractTextFromPDF(buffer);

  console.log(text.slice(0, 500));
  console.log("\n---");
  console.log("Total characters:", text.length);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
