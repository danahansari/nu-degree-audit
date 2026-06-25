import type { Requirement } from "./types";

import requirementsJson from "../data/requirements.json";

const requirements = requirementsJson as unknown as Requirement[];

export function getAllRequirements(): Requirement[] {
  return requirements;
}

export function getRequirementsByDegree(
  degree: "EE" | "CS_MINOR" | "MCCORMICK_CORE",
): Requirement[] {
  return requirements.filter((r) => r.degree === degree);
}

export function getRequirementById(id: string): Requirement | undefined {
  return requirements.find((r) => r.id === id);
}

export default requirements;
