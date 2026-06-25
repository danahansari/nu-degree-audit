# NU Degree Audit

NU Degree Audit is a Next.js web app that helps Northwestern McCormick students understand degree progress by uploading an **unofficial transcript PDF** and generating a **visual, course-by-course audit**. It was built specifically for students pursuing **B.S. Electrical Engineering (McCormick)** alongside the **CS Minor**, with overlap/double-count detection.

## Live Demo

- Vercel: _(add link after first deploy)_  
  Example: `https://nu-degree-audit.vercel.app`

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Anthropic Claude API** (course extraction / parsing)
- **pdf-parse** (PDF → text extraction)
- **Vercel** (deployment)

## Features

- **Transcript upload** (drag-and-drop PDF upload)
- **PDF text extraction** (server-side, Node runtime)
- **AI transcript parsing** into structured course objects (code, name, term, units, grade, status)
- **Degree requirements matching** against a static requirements dataset
- **Visual dashboard** with per-category progress bars and course chips
- **Double-count detection** (courses that satisfy multiple requirement categories)
- **Helpful empty/error states** for invalid PDFs, parsing failures, and missing session data

## How It Works

1. You upload a Northwestern **Unofficial Transcript PDF**.
2. The server extracts text from the PDF using `pdf-parse`.
3. The extracted text is sent to Claude to return a strict JSON array of courses.
4. The app matches parsed courses against static requirements stored in `data/requirements.json`.
5. The dashboard renders completion progress, remaining requirements, and double-counts.

This project uses a **static JSON requirements file** so the audit logic is deterministic, debuggable, and easy to update when Northwestern requirements change year-to-year.

## Getting Started (Local Development)

1. Clone the repo

```bash
git clone <your-repo-url>
cd nu-degree-audit
```

2. Install dependencies

```bash
npm install
```

3. Create `.env.local`

Create a file named `.env.local` in the project root:

```bash
ANTHROPIC_API_KEY=your_key_here
```

4. Start the dev server

```bash
npm run dev
```

5. Visit the app

- `http://localhost:3000`

## Project Structure

- `app/`: Next.js App Router pages and API routes
  - `app/api/parse-transcript/route.ts`: PDF upload endpoint → text extraction → Claude parsing
  - `app/dashboard/page.tsx`: Dashboard UI (reads parsed courses from `sessionStorage`)
- `components/`: UI components (upload card, chips, dashboard tabs, requirement sections, summary bar)
- `data/requirements.json`: Static requirements dataset (McCormick Core, EE, CS Minor)
- `lib/`:
  - `lib/parsePDF.ts`: PDF buffer → extracted text
  - `lib/claudeParser.ts`: transcript text → `ParsedCourse[]` via Claude
  - `lib/matchCourses.ts`: matching + audit computation + double-count detection
  - `lib/requirements.ts`: typed loader/helpers for requirements JSON
  - `lib/types.ts`: core TypeScript interfaces
- `scripts/`: local test scripts (pdf extraction, Claude parsing)

## Known Limitations

- Requirements data is **hardcoded** for a specific academic year (e.g. 2025–2026) and must be manually updated.
- Currently scoped to **B.S. Electrical Engineering (McCormick)** + **CS Minor**.
- SS/H course matching is approximate (broad “non-engineering” heuristic, not catalog-verified).
- AI parsing quality depends on transcript PDF text quality (scans, copy protections, etc.).

