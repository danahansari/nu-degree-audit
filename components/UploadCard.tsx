"use client";

import { useId, useRef, useState } from "react";

interface UploadCardProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  error?: boolean;
}

function isPdf(file: File): boolean {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

export function UploadCard({ onFileSelect, disabled, error }: UploadCardProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const canInteract = !disabled;

  const selectFile = (file: File) => {
    if (!isPdf(file)) return;
    setSelectedName(file.name);
    onFileSelect(file);
  };

  return (
    <div className="w-full">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        disabled={!canInteract}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          selectFile(file);
          e.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        disabled={!canInteract}
        onClick={() => {
          if (!canInteract) return;
          inputRef.current?.click();
        }}
        onDragOver={(e) => {
          if (!canInteract) return;
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!canInteract) return;
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          if (!canInteract) return;
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          selectFile(file);
        }}
        className={[
          "group w-full rounded-2xl bg-white p-6 text-left shadow-sm transition",
          "border-2 border-dashed",
          disabled ? "opacity-60" : "hover:shadow-md",
          error
            ? "border-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.15)]"
            : isDragOver
              ? "border-[#4E2A84] shadow-[0_0_0_4px_rgba(78,42,132,0.18)]"
              : "border-[#4E2A84]/50",
          disabled || error
            ? ""
            : "hover:border-[#4E2A84] hover:shadow-[0_0_0_4px_rgba(78,42,132,0.10)]",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4E2A84]/25",
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <div
            className={[
              "mt-1 flex h-12 w-12 items-center justify-center rounded-xl",
              "bg-[#4E2A84]/10 text-[#4E2A84]",
              disabled ? "" : "group-hover:bg-[#4E2A84]/15",
            ].join(" ")}
            aria-hidden="true"
          >
            {/* Arrow-up-from-bracket style icon */}
            <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v10m0-10l-3 3m3-3l3 3M5 14v4a3 3 0 003 3h8a3 3 0 003-3v-4"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-gray-900">Upload Your Transcript</div>
            <div className="mt-1 text-sm text-gray-600">
              Drag and drop or click to select your Northwestern unofficial transcript PDF
            </div>

            <div className="mt-4">
              {selectedName ? (
                <span className="inline-flex max-w-full items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <span className="truncate">{selectedName}</span>
                </span>
              ) : (
                <div className="text-xs text-gray-500">
                  Download from CAESAR → Student → Transcript → Unofficial Transcript
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

