"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CourseAllocator } from "@/components/CourseAllocator";
import { loadAllocations, saveAllocations } from "@/lib/courseAllocations";
import { computeAudit, getAllocatableCourses } from "@/lib/matchCourses";
import { getAllRequirements } from "@/lib/requirements";
import type { CourseAllocationMap, ParsedCourse } from "@/lib/types";

export default function AllocatePage() {
  const [rawCourses, setRawCourses] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<CourseAllocationMap>({});

  useEffect(() => {
    setRawCourses(sessionStorage.getItem("parsedCourses"));
    setAllocations(loadAllocations());
  }, []);

  useEffect(() => {
    document.title = "NU Degree Audit — Allocate Credits";
  }, []);

  const parsedCourses = useMemo(() => {
    if (!rawCourses) return null;
    try {
      return JSON.parse(rawCourses) as ParsedCourse[];
    } catch {
      return null;
    }
  }, [rawCourses]);

  const handleAllocationsChange = useCallback((next: CourseAllocationMap) => {
    setAllocations(next);
    saveAllocations(next);
  }, []);

  const allRequirements = getAllRequirements();

  const autoAuditResults = useMemo(() => {
    if (!parsedCourses) return [];
    return computeAudit(parsedCourses, allRequirements);
  }, [parsedCourses, allRequirements]);

  const allocatableCount = useMemo(() => {
    if (!parsedCourses) return 0;
    return getAllocatableCourses(parsedCourses).length;
  }, [parsedCourses]);

  if (!parsedCourses) {
    return (
      <main className="min-h-screen bg-[#f9fafb] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="text-lg font-bold text-gray-900">No transcript data found</div>
              <div className="mt-2 text-sm text-gray-600">
                Upload your transcript first, then you can allocate flexible credits.
              </div>
              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex rounded-lg bg-[#4E2A84] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3E216B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4E2A84]/25"
                >
                  Back to Upload
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f9fafb] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#4E2A84]">Allocate your courses</h1>
            <p className="mt-1 text-sm text-gray-600">
              Assign courses to requirements and double-count where allowed.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#4E2A84] hover:underline"
          >
            View dashboard →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-500">
          <Link href="/" className="hover:text-gray-800 hover:underline">
            ← Upload New Transcript
          </Link>
          <Link href="/dashboard" className="hover:text-gray-800 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {allocatableCount === 0 ? (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="text-sm font-semibold text-gray-900">No courses to allocate</div>
            <p className="mt-2 text-sm text-gray-600">
              Upload a transcript first to assign and double-count courses.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg bg-[#4E2A84] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3E216B]"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <CourseAllocator
              courses={parsedCourses}
              auditResults={autoAuditResults}
              allocations={allocations}
              onAllocationsChange={handleAllocationsChange}
            />
          </div>
        )}
      </div>
    </main>
  );
}
