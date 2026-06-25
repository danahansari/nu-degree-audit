"use client";

import { ApCreditChecklist } from "@/components/ApCreditChecklist";
import { UploadCard } from "@/components/UploadCard";
import {
  apSelectionsToCourses,
  loadApCreditSelections,
  mergeTranscriptAndApCredits,
} from "@/lib/apCredits";
import { clearAllocations } from "@/lib/courseAllocations";
import type { ParsedCourse } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [courses, setCourses] = useState<ParsedCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Uploading transcript...");

  useEffect(() => {
    if (state !== "loading") return;

    setProgress(0);
    setProgressLabel("Uploading transcript...");

    const stages = [
      { at: 15, label: "Uploading transcript..." },
      { at: 35, label: "Reading PDF..." },
      { at: 60, label: "Extracting courses..." },
      { at: 85, label: "Matching requirements..." },
      { at: 92, label: "Almost done..." },
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += current < 60 ? 2 : current < 85 ? 0.8 : 0.3;
      if (current > 92) current = 92;
      setProgress(current);
      const stage = [...stages].reverse().find((s) => current >= s.at);
      if (stage) setProgressLabel(stage.label);
    }, 200);

    return () => clearInterval(interval);
  }, [state]);

  const uploadDisabled = state === "loading" || state === "error";
  const isUploadValidationError =
    error === "Please upload a PDF file" ||
    error === "File too large. Please upload your transcript PDF (should be under 10MB)" ||
    error === "No transcript file provided";

  const onFileSelect = async (file: File) => {
    setState("loading");
    setError(null);
    setCourses(null);

    try {
      const formData = new FormData();
      formData.append("transcript", file);

      const res = await fetch("/api/parse-transcript", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as
        | { courses: ParsedCourse[]; courseCount: number; studentName?: string; gpa?: string }
        | { error: string };

      if (!res.ok) {
        const message = "error" in data ? data.error : "Something went wrong. Please try again.";
        throw new Error(message);
      }

      const transcriptCourses = "courses" in data ? data.courses : [];
      const apCourses = apSelectionsToCourses(loadApCreditSelections());
      const mergedCourses = mergeTranscriptAndApCredits(transcriptCourses, apCourses);

      setProgress(100);
      setProgressLabel("Done!");
      setCourses(mergedCourses);
      setState("success");

      clearAllocations();
      sessionStorage.setItem("parsedCourses", JSON.stringify(mergedCourses));
      sessionStorage.setItem("studentName", "studentName" in data ? (data.studentName ?? "") : "");
      sessionStorage.setItem("gpa", "gpa" in data ? (data.gpa ?? "") : "");

      router.push("/dashboard");
    } catch (err) {
      setProgress(0);
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[#4E2A84]">NU Degree Audit</h1>
        <p className="mt-2 text-sm text-gray-600">Know exactly where you stand</p>
        <p className="mt-1 text-xs font-medium text-[#4E2A84]/80">
          Designed for EE major and CS minor
        </p>

        <div className="mt-8">
          <ApCreditChecklist />
        </div>

        <div className="mt-6">
          <UploadCard onFileSelect={onFileSelect} disabled={uploadDisabled} error={state === "error" && isUploadValidationError} />
          {state === "error" && isUploadValidationError ? (
            <div className="mt-3 text-sm font-medium text-red-700">{error}</div>
          ) : null}
        </div>

        {state === "loading" && (
          <div className="mt-8 w-full" role="status" aria-live="polite" aria-label="Parsing transcript">
            <div className="text-sm font-medium text-gray-800">{progressLabel}</div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#4E2A84] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{Math.round(progress)}%</span>
              <span>This usually takes 10-15 seconds</span>
            </div>
          </div>
        )}

        {state === "error" && !isUploadValidationError && (
          <div className="mt-8 rounded-xl border border-red-300 bg-white p-4">
            <div className="text-sm font-semibold text-red-700">Something went wrong</div>
            <div className="mt-2 text-sm text-red-700">{error ?? "Unknown error"}</div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setState("idle");
                  setError(null);
                  setCourses(null);
                  setProgress(0);
                  setProgressLabel("Uploading transcript...");
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="mt-8">
            <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-900">
              Transcript parsed! Found {courses?.length ?? 0} courses.
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => console.log("View Dashboard clicked. Courses:", courses)}
                className="rounded-lg bg-[#4E2A84] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3E216B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4E2A84]/25"
              >
                View Dashboard
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm font-bold text-gray-900">Where do I find my transcript?</div>
          <div className="mt-2 text-sm text-gray-700">
            Download it from{" "}
            <a
              href="https://caesar.northwestern.edu"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#4E2A84] hover:underline"
            >
              CAESAR
            </a>{" "}
            → Student → Transcript → View Unofficial Transcript
          </div>
        </div>
      </div>
    </main>
  );
}
