import * as pdfParse from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse@2.x requires Uint8Array (Buffer is rejected).
    const bytes = new Uint8Array(buffer);

    const parser = new (pdfParse as any).PDFParse(bytes);
    const textResult = await parser.getText();
    const text =
      typeof textResult === "string"
        ? textResult
        : typeof (textResult as any)?.text === "string"
          ? ((textResult as any).text as string)
          : "";

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
  }
}
