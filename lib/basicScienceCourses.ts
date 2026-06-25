import { normalizeCode } from "./courseCodes";

/** Lecture + lab pairs; labs only count toward basic science with their lecture. */
export const BASIC_SCIENCE_LAB_PAIRS: Record<string, string> = {
  "BIOL_SCI 232-0": "BIOL_SCI 202-0",
  "CHEM 141-0": "CHEM 131-0",
  "CHEM 161-0": "CHEM 151-0",
  "CHEM 181-0": "CHEM 171-0",
  "PHYSICS 136-2": "PHYSICS 135-2",
  "PHYSICS 126-2": "PHYSICS 125-2",
  "PHYSICS 136-3": "PHYSICS 135-3",
  "PHYSICS 126-3": "PHYSICS 125-3",
  "BIOL_SCI 233-0": "BIOL_SCI 203-0",
  "CHEM 142-0": "CHEM 132-0",
  "CHEM 162-0": "CHEM 152-0",
  "CHEM 182-0": "CHEM 172-0",
  "CHEM 235-1": "CHEM 215-1",
  "CHEM 235-2": "CHEM 215-2",
};

const BASIC_SCIENCE_LECTURE_ALTERNATIVES: Record<string, string[]> = {
  "PHYSICS 135-2": ["PHYSICS 125-2", "PHYSICS 140-2"],
  "PHYSICS 135-3": ["PHYSICS 125-3", "PHYSICS 140-3"],
  "CHEM 131-0": ["CHEM 151-0", "CHEM 171-0"],
  "CHEM 132-0": ["CHEM 152-0", "CHEM 172-0"],
};

/** Approved basic science courses (lectures and labs). */
const BASIC_SCIENCE_CODES = new Set([
  // Biology
  "BIOL_SCI 150-0",
  "BIOL_SCI 201-0",
  "BIOL_SCI 202-0",
  "BIOL_SCI 203-0",
  "BIOL_SCI 232-0",
  "BIOL_SCI 233-0",
  "BIOL_SCI 234-0",
  "CHEM_ENG 275-0",
  "CIV_ENV 202-0",
  // Chemistry
  "CHEM 131-0",
  "CHEM 141-0",
  "CHEM 132-0",
  "CHEM 142-0",
  "CHEM 151-0",
  "CHEM 161-0",
  "CHEM 152-0",
  "CHEM 162-0",
  "CHEM 171-0",
  "CHEM 181-0",
  "CHEM 172-0",
  "CHEM 182-0",
  "CHEM 215-1",
  "CHEM 235-1",
  "CHEM 215-2",
  "CHEM 235-2",
  // Earth / astronomy
  "ASTRON 220-1",
  "ASTRON 220-2",
  "CIV_ENV 203-0",
  "EARTH 210-0",
  "EARTH 214-0",
  "EARTH 215-0",
  // Physics
  "PHYSICS 125-2",
  "PHYSICS 126-2",
  "PHYSICS 135-2",
  "PHYSICS 136-2",
  "PHYSICS 140-2",
  "PHYSICS 125-3",
  "PHYSICS 126-3",
  "PHYSICS 135-3",
  "PHYSICS 136-3",
  "PHYSICS 140-3",
  "PHYSICS 239-0",
  // Neuroscience / cognition
  "COG_SCI 210-0",
  "CSD 202-0",
  "CSD 303-0",
  "PSYCH 221-0",
  // AP / transfer placeholders eligible for basic science
  "CHEM 1X0",
  "CHEM 1X1",
  "CHEM 1X2",
  "CHEM 11X",
  "CHEM 12X",
]);

export function isApprovedBasicScienceCourse(courseCode: string): boolean {
  const code = normalizeCode(courseCode);
  if (!code) return false;
  if (BASIC_SCIENCE_CODES.has(code)) return true;

  for (const [primary, alts] of Object.entries(BASIC_SCIENCE_LECTURE_ALTERNATIVES)) {
    const normalizedPrimary = normalizeCode(primary);
    const normalizedAlts = alts.map(normalizeCode);
    if (code === normalizedPrimary || normalizedAlts.includes(code)) return true;
  }

  return false;
}

export function isBasicScienceLabCourse(courseCode: string): boolean {
  return normalizeCode(courseCode) in BASIC_SCIENCE_LAB_PAIRS;
}
