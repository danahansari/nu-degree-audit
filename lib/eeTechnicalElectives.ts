import { normalizeCode } from "./courseCodes";

export const EE_TRACK_COURSES = new Set(
  [
    // Biomedical
    "BMD_ENG 325-0",
    "BMD_ENG 327-0",
    "BMD_ENG 333-0",
    // Circuits and electronics
    "COMP_ENG 303-0",
    "COMP_ENG 346-0",
    "COMP_ENG 347-2",
    "COMP_ENG 355-0",
    "COMP_ENG 391-0",
    "COMP_ENG 393-0",
    "ELEC_ENG 326-0",
    "ELEC_ENG 327-0",
    "ELEC_ENG 353-0",
    // Communications
    "ELEC_ENG 307-0",
    "ELEC_ENG 328-0",
    "ELEC_ENG 333-0",
    "ELEC_ENG 334-0",
    "ELEC_ENG 378-0",
    "ELEC_ENG 380-0",
    // Control
    "ELEC_ENG 360-0",
    "ELEC_ENG 374-0",
    "ELEC_ENG 390-0",
    "MECH_ENG 333-0",
    // Signal processing / ML
    "ELEC_ENG 332-0",
    "ELEC_ENG 335-0",
    "ELEC_ENG 359-0",
    "ELEC_ENG 363-0",
    "ELEC_ENG 373-0",
    "ELEC_ENG 375-0",
    // Electromagnetics / optics
    "ELEC_ENG 308-0",
    "ELEC_ENG 379-0",
    "ELEC_ENG 382-0",
    "ELEC_ENG 383-0",
    // Solid state
    "ELEC_ENG 250-0",
    "ELEC_ENG 381-0",
    "ELEC_ENG 384-0",
    "ELEC_ENG 385-0",
    "ELEC_ENG 388-0",
  ].map(normalizeCode),
);

export const EE_DESIGN_COURSES = new Set(
  [
    "COMP_ENG 347-1",
    "COMP_ENG 392-0",
    "ELEC_ENG 327-0",
    "ELEC_ENG 398-0",
    "ELEC_ENG 399-0",
  ].map(normalizeCode),
);

export const EE_ADVANCED_TECHNICAL_COURSES = new Set(
  [
    "BIOL_SCI 201-0",
    "BIOL_SCI 202-0",
    "BIOL_SCI 203-0",
    "CHEM 215-1",
    "CHEM 215-2",
    "CHEM 215-3",
  ].map(normalizeCode),
);

const EE_REQUIRED_CODES = new Set(
  [
    "COMP_ENG 203-0",
    "COMP_SCI 211-0",
    "COMP_SCI 150-0",
    "ELEC_ENG 202-0",
    "ELEC_ENG 221-0",
    "ELEC_ENG 222-0",
    "ELEC_ENG 223-0",
    "ELEC_ENG 224-0",
    "ELEC_ENG 225-0",
    "ELEC_ENG 302-0",
  ].map(normalizeCode),
);

const MCCORMICK_ENGINEERING_SUBJECTS = new Set([
  "COMP_SCI",
  "COMP_ENG",
  "ELEC_ENG",
  "MECH_ENG",
  "CIV_ENV",
  "BMD_ENG",
  "CHEM_ENG",
  "IND_ENG",
  "MAT_SCI",
  "MSE",
  "GEN_ENG",
  "DSGN",
]);

function catalogLevel(code: string): number | null {
  const normalized = normalizeCode(code);
  const numPart = normalized.split(" ")[1]?.split("-")[0];
  if (!numPart) return null;
  const level = Number.parseInt(numPart, 10);
  return Number.isFinite(level) ? level : null;
}

function subject(code: string): string {
  return normalizeCode(code).split(" ")[0] ?? "";
}

export function isEeTrackTechnicalElective(code: string): boolean {
  return EE_TRACK_COURSES.has(normalizeCode(code));
}

export function isEeDesignCourse(code: string): boolean {
  return EE_DESIGN_COURSES.has(normalizeCode(code));
}

export function isEe300LevelCeeElective(code: string): boolean {
  const normalized = normalizeCode(code);
  if (normalized === "COMP_ENG 205-0") return true;
  if (EE_TRACK_COURSES.has(normalized)) return true;

  const level = catalogLevel(code);
  if (level === null || level < 300) return false;

  const subj = subject(code);
  return subj === "COMP_SCI" || subj === "ELEC_ENG" || subj === "COMP_ENG";
}

export function isEeAdvancedTechnicalElective(code: string): boolean {
  const normalized = normalizeCode(code);
  if (EE_ADVANCED_TECHNICAL_COURSES.has(normalized)) return true;
  if (EE_TRACK_COURSES.has(normalized)) return true;
  if (isEe300LevelCeeElective(code)) return true;

  const level = catalogLevel(code);
  if (level === null || level < 300) return false;

  const subj = subject(code);
  return (
    MCCORMICK_ENGINEERING_SUBJECTS.has(subj) ||
    subj === "MATH" ||
    subj === "PHYSICS" ||
    subj === "CHEM" ||
    subj === "BIOL_SCI" ||
    subj === "EARTH" ||
    subj === "ASTRON" ||
    subj === "STAT"
  );
}

export function isAbetEngineeringTopicsCourse(code: string): boolean {
  const normalized = normalizeCode(code);
  if (EE_REQUIRED_CODES.has(normalized)) return false;
  if (EE_TRACK_COURSES.has(normalized)) return false;
  if (EE_DESIGN_COURSES.has(normalized)) return false;

  const level = catalogLevel(code);
  if (level === null || level < 200) return false;

  return MCCORMICK_ENGINEERING_SUBJECTS.has(subject(code));
}
