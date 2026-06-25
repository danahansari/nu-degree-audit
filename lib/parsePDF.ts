import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const textResult = await parser.getText();
    const text = typeof textResult?.text === "string" ? textResult.text : "";

    if (text.trim().length === 0) {
      throw new Error(
        "PDF appears to be empty or unreadable. Try re-downloading your transcript from CAESAR.",
      );
    }

    return text;
  } catch (err) {
    if (
      err instanceof Error &&
      err.message ===
        "PDF appears to be empty or unreadable. Try re-downloading your transcript from CAESAR."
    ) {
      throw err;
    }

    throw new Error("Could not read PDF file. Make sure you uploaded a valid PDF.");
  } finally {
    await parser.destroy();
  }
}
