export const runtime = "nodejs";

import { NextResponse } from "next/server";

import type { ParsedCourse } from "@/lib/types";
import { parseCourses } from "@/lib/claudeParser";
import { parseCoursesWithGemini } from "@/lib/geminiParser";
import { extractTextFromPDF } from "@/lib/parsePDF";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const CLAUDE_TIMEOUT_MS = 30_000;

const PDF_READ_ERROR =
  "Could not read the PDF. Try re-downloading your transcript from CAESAR (Student → Transcript → View Unofficial Transcript).";
const AI_PARSE_ERROR =
  "AI could not parse your transcript. Please try again — if the issue persists, make sure you're uploading a Northwestern unofficial transcript.";
const NO_COURSES_ERROR =
  "No courses found in the transcript. Make sure you uploaded your Northwestern Unofficial Transcript (not the official one or a different document).";
const TIMEOUT_ERROR = "Request timed out. Please try again.";
const GEMINI_QUOTA_ERROR =
  "AI parsing is currently unavailable: your Gemini API quota is exceeded or not enabled for this project. Please check your Google AI Studio / Cloud billing and quota settings, then try again.";
const GEMINI_HIGH_DEMAND_ERROR =
  "AI parsing is temporarily unavailable due to high demand. Please try again in a minute.";
const NETWORK_ERROR = "Network error while contacting the AI provider. Please try again.";
const GEMINI_MODEL_ERROR =
  "AI parsing is unavailable because the configured Gemini model isn't available for this API key/project. Please update the model or check your Gemini API access.";

function normalizeAiProviderErrorMessage(raw: string): string {
  const msg = raw || "";

  // Gemini: quota / rate limit
  if (
    /RESOURCE_EXHAUSTED/i.test(msg) ||
    /quota exceeded/i.test(msg) ||
    /rate limits?/i.test(msg) ||
    /code\"?\s*:\s*429/i.test(msg)
  ) {
    return GEMINI_QUOTA_ERROR;
  }

  // Gemini: high demand / unavailable
  if (
    /status\"?\s*:\s*\"UNAVAILABLE\"/i.test(msg) ||
    /high demand/i.test(msg) ||
    /code\"?\s*:\s*503/i.test(msg)
  ) {
    return GEMINI_HIGH_DEMAND_ERROR;
  }

  // Gemini: model not found / not available
  if (
    /status\"?\s*:\s*\"NOT_FOUND\"/i.test(msg) ||
    /code\"?\s*:\s*404/i.test(msg) ||
    /model[s]?\//i.test(msg) && /no longer available|not available|NOT_FOUND/i.test(msg)
  ) {
    return GEMINI_MODEL_ERROR;
  }

  // Node fetch/network errors
  if (/fetch failed/i.test(msg) || /ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(msg)) {
    return NETWORK_ERROR;
  }

  return msg;
}

function extractStudentName(transcriptText: string): string | null {
  // e.g. "Name: Lastname,Firstname"
  const match = transcriptText.match(/Name:\s*([A-Za-z' -]+,\s*[A-Za-z' -]+)/i);
  return match?.[1]?.trim() ?? null;
}

function extractGpa(transcriptText: string): string | null {
  // e.g. "Cum GPA 3.851"
  const match = transcriptText.match(/Cum\s*GPA\s*([0-9]\.[0-9]{2,3})/i);
  return match?.[1]?.trim() ?? null;
}

function isProbablyPdf(file: File): boolean {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  return type === "application/pdf" || name.endsWith(".pdf");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const transcript = formData.get("transcript");

    if (!transcript || !(transcript instanceof File)) {
      return NextResponse.json({ error: "No transcript file provided" }, { status: 400 });
    }

    if (!isProbablyPdf(transcript)) {
      return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
    }

    if (transcript.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: "File too large. Please upload your transcript PDF (should be under 10MB)",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await transcript.arrayBuffer());

    let transcriptText: string;
    try {
      transcriptText = await extractTextFromPDF(buffer);
    } catch {
      return NextResponse.json({ error: PDF_READ_ERROR }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

    let courses: ParsedCourse[];
    try {
      const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      courses = hasGeminiKey
        ? await parseCoursesWithGemini(transcriptText, { signal: controller.signal })
        : await parseCourses(transcriptText, { signal: controller.signal });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (
        controller.signal.aborted ||
        /aborted|abort|timeout/i.test(msg)
      ) {
        return NextResponse.json({ error: TIMEOUT_ERROR }, { status: 500 });
      }

      if (msg === "AI could not parse the transcript. Please try again.") {
        return NextResponse.json({ error: AI_PARSE_ERROR }, { status: 500 });
      }

      return NextResponse.json({ error: normalizeAiProviderErrorMessage(msg) }, { status: 500 });
    } finally {
      clearTimeout(timeout);
    }

    if (!Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: NO_COURSES_ERROR }, { status: 500 });
    }

    const studentName = extractStudentName(transcriptText) ?? "";
    const gpa = extractGpa(transcriptText) ?? "";

    return NextResponse.json(
      { courses, courseCount: courses.length, studentName, gpa },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

