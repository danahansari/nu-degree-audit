"use client";

import { useMemo, useState } from "react";

import {
  ALLOCATION_TARGETS,
  AUTO_ALLOCATION,
  getAllocationLabel,
  getAllocationSectionStyle,
  sectionOrderIndex,
  UNALLOCATED_SECTION,
} from "@/lib/allocationTargets";
import { allocationIdsEqual } from "@/lib/courseAllocations";
import { isApCreditCourse, makeCourseKey } from "@/lib/courseCodes";
import type { CourseAllocationMap, MatchedRequirement, ParsedCourse } from "@/lib/types";
import { getAllocatableCourses, getCourseAssignmentIds } from "@/lib/matchCourses";

interface CourseAllocatorProps {
  courses: ParsedCourse[];
  auditResults: MatchedRequirement[];
  allocations: CourseAllocationMap;
  onAllocationsChange: (next: CourseAllocationMap) => void;
}

function statusLabel(course: ParsedCourse): string {
  if (isApCreditCourse(course)) return "AP";
  if (course.status === "transfer") return "Transfer";
  return course.status === "in_progress" ? "In progress" : "Completed";
}

function formatUnits(units: number): string {
  const rounded = Math.round(units * 100) / 100;
  return `${rounded} unit${rounded === 1 ? "" : "s"}`;
}

export function CourseAllocator({
  courses,
  auditResults,
  allocations,
  onAllocationsChange,
}: CourseAllocatorProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkTarget, setBulkTarget] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string[]>>({});

  const allocatable = useMemo(() => getAllocatableCourses(courses), [courses]);

  const groupedTargets = useMemo(() => {
    const groups = new Map<string, typeof ALLOCATION_TARGETS>();
    for (const t of ALLOCATION_TARGETS) {
      if (t.id === AUTO_ALLOCATION) continue;
      const g = t.group || "Other";
      const list = groups.get(g) ?? [];
      list.push(t);
      groups.set(g, list);
    }
    return groups;
  }, []);

  const groupedBySection = useMemo(() => {
    const groups = new Map<string, ParsedCourse[]>();

    for (const course of allocatable) {
      const key = makeCourseKey(course);
      const manualIds = allocations[key];
      const autoIds = getCourseAssignmentIds(course, auditResults);
      const activeIds = manualIds ?? autoIds;
      const primaryId =
        [...activeIds].sort((a, b) => sectionOrderIndex(a) - sectionOrderIndex(b))[0] ??
        UNALLOCATED_SECTION;
      const list = groups.get(primaryId) ?? [];
      list.push(course);
      groups.set(primaryId, list);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => sectionOrderIndex(a) - sectionOrderIndex(b))
      .map(([sectionId, sectionCourses]) => ({
        sectionId,
        style: getAllocationSectionStyle(sectionId),
        courses: sectionCourses.sort((a, b) => a.code.localeCompare(b.code)),
      }));
  }, [allocatable, allocations, auditResults]);

  if (allocatable.length === 0) return null;

  const allKeys = allocatable.map((c) => makeCourseKey(c));
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));

  const getAutoIds = (courseKey: string, course: ParsedCourse) =>
    getCourseAssignmentIds(course, auditResults);

  const getSavedIds = (courseKey: string, course: ParsedCourse) =>
    allocations[courseKey] ?? getAutoIds(courseKey, course);

  const getDraftIds = (courseKey: string, course: ParsedCourse) =>
    draftEdits[courseKey] ?? getSavedIds(courseKey, course);

  const hasDraftChanges = (courseKey: string, course: ParsedCourse) => {
    if (!(courseKey in draftEdits)) return false;
    return !allocationIdsEqual(draftEdits[courseKey], getSavedIds(courseKey, course));
  };

  const openEdit = (courseKey: string, course: ParsedCourse) => {
    setExpandedKey(courseKey);
    setDraftEdits((prev) => ({
      ...prev,
      [courseKey]: [...getSavedIds(courseKey, course)],
    }));
  };

  const cancelEdit = (courseKey: string) => {
    setDraftEdits((prev) => {
      const next = { ...prev };
      delete next[courseKey];
      return next;
    });
    setExpandedKey((current) => (current === courseKey ? null : current));
  };

  const toggleDraftRequirement = (
    courseKey: string,
    course: ParsedCourse,
    requirementId: string,
    checked: boolean,
  ) => {
    const current = getDraftIds(courseKey, course);
    const nextIds = checked
      ? [...new Set([...current, requirementId])]
      : current.filter((id) => id !== requirementId);
    setDraftEdits((prev) => ({ ...prev, [courseKey]: nextIds }));
  };

  const saveDraft = (courseKey: string, course: ParsedCourse) => {
    const draft = getDraftIds(courseKey, course);
    const autoIds = getAutoIds(courseKey, course);
    const next = { ...allocations };

    if (draft.length === 0 || allocationIdsEqual(draft, autoIds)) {
      delete next[courseKey];
    } else {
      next[courseKey] = draft;
    }

    onAllocationsChange(next);
    cancelEdit(courseKey);
  };

  const resetToAutomatic = (courseKey: string) => {
    if (expandedKey === courseKey) cancelEdit(courseKey);
    const next = { ...allocations };
    delete next[courseKey];
    onAllocationsChange(next);
  };

  const applyBulkAdd = () => {
    if (!bulkTarget) return;
    const next = { ...allocations };
    for (const key of selectedKeys) {
      const course = allocatable.find((c) => makeCourseKey(c) === key);
      if (!course) continue;
      const autoIds = getAutoIds(key, course);
      const current = next[key] ?? autoIds;
      const nextIds = [...new Set([...current, bulkTarget])];
      if (allocationIdsEqual(nextIds, autoIds)) delete next[key];
      else next[key] = nextIds;
    }
    onAllocationsChange(next);
    setSelectedKeys(new Set());
  };

  const applyBulkReset = () => {
    const next = { ...allocations };
    for (const key of selectedKeys) delete next[key];
    onAllocationsChange(next);
    setSelectedKeys(new Set());
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(allKeys));
  };

  return (
    <div className="rounded-xl border border-[#4E2A84]/25 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-gray-900">
            {allocatable.length} course{allocatable.length === 1 ? "" : "s"}
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            Check multiple requirements to double-count a course (e.g. CS 211 for EE and CS minor).
          </p>
        </div>
        {selectedKeys.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600">{selectedKeys.size} selected</span>
            <select
              value={bulkTarget}
              onChange={(e) => setBulkTarget(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs"
              aria-label="Bulk add requirement"
            >
              <option value="">Add to requirement…</option>
              {[...groupedTargets.entries()].map(([group, targets]) => (
                <optgroup key={group} label={group}>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulkAdd}
              disabled={!bulkTarget}
              className="rounded-lg bg-[#4E2A84] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3E216B] disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={applyBulkReset}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset to auto
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-100 pb-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-[#4E2A84]"
          />
          Select all
        </label>
        {groupedBySection.map(({ sectionId, style }) => (
          <div key={sectionId} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
            {style.label}
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-5">
        {groupedBySection.map(({ sectionId, style, courses: sectionCourses }) => (
          <section key={sectionId}>
            <div
              className={[
                "mb-2 flex items-center gap-2 rounded-lg px-3 py-2",
                style.headerBg,
                style.headerText,
              ].join(" ")}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
              <h3 className="text-xs font-bold">{style.label}</h3>
              <span className="text-xs font-medium opacity-70">({sectionCourses.length})</span>
            </div>

            <ul className="space-y-2">
              {sectionCourses.map((course) => {
                const key = makeCourseKey(course);
                const savedIds = getSavedIds(key, course);
                const isManual = !!allocations[key];
                const isDoubleCount = savedIds.length >= 2;
                const isExpanded = expandedKey === key;
                const isDirty = hasDraftChanges(key, course);
                const draftIds = getDraftIds(key, course);

                return (
                  <li
                    key={key}
                    className={[
                      "rounded-lg border-l-4 px-3 py-2",
                      style.rowBorder,
                      style.rowBg,
                      isManual ? "ring-1 ring-[#4E2A84]/30" : "",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(key)}
                          onChange={() => toggleSelect(key)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#4E2A84]"
                          aria-label={`Select ${course.code}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            <span className="font-mono">{course.code}</span>
                            <span className="mx-1 font-normal text-gray-500">—</span>
                            {course.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {statusLabel(course)} · {formatUnits(course.attempted)}
                            {isManual ? " · Manual override" : " · Automatic"}
                            {isDoubleCount ? " · 2× counts" : ""}
                          </div>
                          {savedIds.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {savedIds.map((id) => {
                                const pillStyle = getAllocationSectionStyle(id);
                                return (
                                  <span
                                    key={id}
                                    className={[
                                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                      pillStyle.headerBg,
                                      pillStyle.headerText,
                                    ].join(" ")}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full ${pillStyle.dot}`} />
                                    {getAllocationLabel(id)}
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-6 sm:pl-0">
                        <button
                          type="button"
                          onClick={() =>
                            isExpanded ? cancelEdit(key) : openEdit(key, course)
                          }
                          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {isExpanded ? "Cancel" : "Edit"} requirements
                        </button>
                        {isManual ? (
                          <button
                            type="button"
                            onClick={() => resetToAutomatic(key)}
                            className="text-xs font-medium text-[#4E2A84] hover:underline"
                          >
                            Reset
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-3 border-t border-gray-200/80 pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-gray-700">Count towards</div>
                          {isDirty ? (
                            <span className="text-[10px] font-medium text-amber-700">Unsaved changes</span>
                          ) : null}
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {[...groupedTargets.entries()].map(([group, targets]) => (
                            <div key={group}>
                              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                {group}
                              </div>
                              <ul className="mt-1 space-y-1">
                                {targets.map((t) => (
                                  <li key={t.id}>
                                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={draftIds.includes(t.id)}
                                        onChange={(e) =>
                                          toggleDraftRequirement(key, course, t.id, e.target.checked)
                                        }
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#4E2A84]"
                                      />
                                      {t.label}
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => saveDraft(key, course)}
                            disabled={!isDirty}
                            className="rounded-lg bg-[#4E2A84] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3E216B] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEdit(key)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
