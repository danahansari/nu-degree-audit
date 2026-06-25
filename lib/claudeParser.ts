import Anthropic from "@anthropic-ai/sdk";

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

  // ```json\n...\n``` or ```\n...\n```
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "");
    text = text.replace(/\s*```$/i, "");
  }

  return text.trim();
}

function extractResponseText(message: unknown): string {
  const content = (message as any)?.content;
  if (!Array.isArray(content)) return "";

  return content
    .map((block: any) => (typeof block?.text === "string" ? block.text : ""))
    .join("")
    .trim();
}

export async function parseCourses(
  transcriptText: string,
  opts?: { signal?: AbortSignal },
): Promise<ParsedCourse[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: transcriptText,
        },
      ],
      ...(opts?.signal ? ({ signal: opts.signal } as any) : {}),
    });

    const rawText = extractResponseText(response);
    const cleaned = stripCodeFences(rawText);

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
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "AI could not parse the transcript. Please try again."
    ) {
      throw err;
    }

    // Requirement: API call failures should throw the original error message
    if (err instanceof Error) throw new Error(err.message);
    throw new Error(String(err));
  }
}

