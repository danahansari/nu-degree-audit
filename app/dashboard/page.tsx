"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { CourseAllocationMap, ParsedCourse } from "@/lib/types";
import { computeAudit, getProgressSummary } from "@/lib/matchCourses";
import { getAllRequirements } from "@/lib/requirements";
import { loadAllocations } from "@/lib/courseAllocations";
import { SummaryBar } from "@/components/SummaryBar";
import { DashboardTabs } from "@/components/DashboardTabs";
import { CourseLegend } from "@/components/CourseLegend";
import { CatalogLinks } from "@/components/CatalogLinks";
import { getAllocatableCourses } from "@/lib/matchCourses";

export default function DashboardPage() {
  const [rawCourses, setRawCourses] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [gpa, setGpa] = useState<string>("");
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [allocations, setAllocations] = useState<CourseAllocationMap>({});

  useEffect(() => {
    setRawCourses(sessionStorage.getItem("parsedCourses"));
    setStudentName(sessionStorage.getItem("studentName") ?? "");
    setGpa(sessionStorage.getItem("gpa") ?? "");
    setAllocations(loadAllocations());
  }, []);

  useEffect(() => {
    const name = studentName?.trim() ? studentName.trim() : "Student";
    document.title = `NU Degree Audit — ${name}`;
  }, [studentName]);

  const parsedCourses = useMemo(() => {
    if (!rawCourses) return null;
    try {
      return JSON.parse(rawCourses) as ParsedCourse[];
    } catch {
      return null;
    }
  }, [rawCourses]);

  const allRequirements = getAllRequirements();

  const autoAuditResults = useMemo(() => {
    if (!parsedCourses) return [];
    return computeAudit(parsedCourses, allRequirements);
  }, [parsedCourses, allRequirements]);

  const auditResults = useMemo(() => {
    if (!parsedCourses) return [];
    return computeAudit(parsedCourses, allRequirements, { allocations });
  }, [parsedCourses, allRequirements, allocations]);

  const summary = useMemo(() => getProgressSummary(auditResults), [auditResults]);

  const allocatableCount = useMemo(() => {
    if (!parsedCourses) return 0;
    return getAllocatableCourses(parsedCourses).length;
  }, [parsedCourses]);

  useEffect(() => {
    if (!parsedCourses) return;
    setShowSkeleton(true);
    const t = setTimeout(() => setShowSkeleton(false), 150);
    return () => clearTimeout(t);
  }, [parsedCourses, allocations]);

  if (!parsedCourses) {
    return (
      <main className="min-h-screen bg-[#f9fafb] px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="text-lg font-bold text-gray-900">No transcript data found</div>
              <div className="mt-2 text-sm text-gray-600">
                Please upload your transcript first.
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
    <main className="min-h-screen bg-[#f9fafb]">
      <SummaryBar
        studentName={studentName}
        gpa={gpa}
        eeCompleted={summary.eeCompleted}
        csCompleted={summary.csCompleted}
        eeInProgress={summary.eeInProgress}
        csInProgress={summary.csInProgress}
      />

      <div className="mx-auto max-w-4xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-body text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline">
            ← Upload New Transcript
          </Link>
          {allocatableCount > 0 ? (
            <Link
              href="/allocate"
              className="rounded-lg border border-[#4E2A84]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#4E2A84] shadow-sm transition hover:bg-[#4E2A84]/5"
            >
              Allocate courses ({allocatableCount})
            </Link>
          ) : null}
        </div>

        <div className="mt-4">
          <CourseLegend />
        </div>

        <div className="mt-4">
          {showSkeleton ? (
            <div className="space-y-4">
              <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
              <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-200" />
            </div>
          ) : (
            <DashboardTabs
              coreRequirements={auditResults.filter((r) => r.degree === "MCCORMICK_CORE")}
              eeRequirements={auditResults.filter((r) => r.degree === "EE")}
              csRequirements={auditResults.filter((r) => r.degree === "CS_MINOR")}
            />
          )}
        </div>

        <CatalogLinks />
      </div>
    </main>
  );
}
