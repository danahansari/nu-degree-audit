import { GoogleGenAI } from "@google/genai";

import type { ParsedCourse } from "./types";

const SYSTEM_PROMPT =
  "You are a transcript parser for Northwestern University. Given raw text extracted from a Northwestern undergraduate transcript PDF, extract all courses and return ONLY a valid JSON array with no explanation, no markdown, no code fences. Each object must have exactly these fields:\n" +
  "- code: string — the course code normalized to uppercase with underscores (e.g. 'COMP_SCI 111-0', 'GEN_ENG 205-1', 'ELEC_ENG 202-0')\n" +
  "- name: string — the course title/description\n" +
  "- attempted: number — units attempted (use 0 if unclear)\n" +
  "- earned: number — units earned (0 if grade is K or in-progress)\n" +
  "- grade: string — letter grade (e.g. 'A', 'A-', 'B+', 'T' for transfer, 'K' for in-progress)\n" +
  "- term: string — academic term (e.g. '2025 Fall', '2025 Winter')\n" +
  "- status: one of 'completed', 'in_progress', or 'transfer'\n" +
  "\n" +
  "Rules: status is 'in_progress' when earned=0 and attempted>0 and grade is not 'T'. Status is 'transfer' when grade='T'. Status is 'completed' otherwise. Include ALL courses including transfer credits.";

function stripCodeFences(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "");
    text = text.replace(/\s*```$/i, "");
  }
  return text.trim();
}

export async function parseCoursesWithGemini(
  transcriptText: string,
  opts?: { signal?: AbortSignal },
): Promise<ParsedCourse[]> {
  // The SDK can pick up GEMINI_API_KEY automatically, but we also allow explicit key.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\nTRANSCRIPT TEXT:\n${transcriptText}` }],
      },
    ],
    ...(opts?.signal ? ({ signal: opts.signal } as any) : {}),
  });

  const raw = typeof (response as any)?.text === "string" ? (response as any).text : "";
  const cleaned = stripCodeFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI could not parse the transcript. Please try again.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI could not parse the transcript. Please try again.");
  }

  return parsed as ParsedCourse[];
}

