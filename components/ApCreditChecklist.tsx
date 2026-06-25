"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getApCategories,
  getApExamCatalog,
  getValidScoresForExam,
  loadApCreditSelections,
  saveApCreditSelections,
} from "@/lib/apCredits";
import type { ApCreditSelection } from "@/lib/types";

export function ApCreditChecklist() {
  const catalog = useMemo(() => getApExamCatalog(), []);
  const categories = useMemo(() => getApCategories(), []);

  const [selections, setSelections] = useState<ApCreditSelection[]>([]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = loadApCreditSelections();
    setSelections(saved);
    const en: Record<string, boolean> = {};
    for (const s of saved) en[s.examId] = true;
    setEnabled(en);
  }, []);

  const persist = (next: ApCreditSelection[], nextEnabled: Record<string, boolean>) => {
    setSelections(next);
    setEnabled(nextEnabled);
    saveApCreditSelections(next.filter((s) => nextEnabled[s.examId]));
  };

  const toggleExam = (examId: string, checked: boolean) => {
    const nextEnabled = { ...enabled, [examId]: checked };
    let next = [...selections];
    const existing = next.find((s) => s.examId === examId);

    if (checked && !existing) {
      const scores = getValidScoresForExam(examId);
      next.push({ examId, score: scores[scores.length - 1] ?? 5 });
    }
    if (!checked) {
      next = next.filter((s) => s.examId !== examId);
    }
    persist(next, nextEnabled);
  };

  const setScore = (examId: string, score: number) => {
    const next = selections.map((s) => (s.examId === examId ? { ...s, score } : s));
    persist(next, enabled);
  };

  const selectedCount = selections.filter((s) => enabled[s.examId]).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm font-bold text-gray-900">AP / transfer credits</div>
      <p className="mt-1 text-xs text-gray-600">
        Check exams you received credit for. These are merged with your transcript during upload (AP
        credit does not appear on unofficial transcripts).
        {selectedCount > 0 ? ` ${selectedCount} selected.` : ""}
      </p>

      <div className="mt-4 max-h-72 space-y-4 overflow-y-auto pr-1">
        {categories.map((category) => {
          const exams = catalog.filter((e) => e.category === category);
          if (exams.length === 0) return null;

          return (
            <div key={category}>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {category}
              </div>
              <ul className="mt-2 space-y-2">
                {exams.map((exam) => {
                  const isOn = !!enabled[exam.id];
                  const sel = selections.find((s) => s.examId === exam.id);
                  const scores = getValidScoresForExam(exam.id);

                  return (
                    <li
                      key={exam.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={(e) => toggleExam(exam.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-[#4E2A84] focus:ring-[#4E2A84]"
                        />
                        <span className="text-sm text-gray-900">{exam.exam}</span>
                      </label>
                      {isOn ? (
                        <select
                          value={sel?.score ?? scores[0]}
                          onChange={(e) => setScore(exam.id, Number(e.target.value))}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800"
                          aria-label={`Score for ${exam.exam}`}
                        >
                          {scores.map((sc) => (
                            <option key={sc} value={sc}>
                              Score {sc}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
