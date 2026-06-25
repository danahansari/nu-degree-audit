import { describe, expect, it } from "vitest";

import {
  isAbetEngineeringTopicsCourse,
  isEe300LevelCeeElective,
  isEeDesignCourse,
  isEeTrackTechnicalElective,
} from "./eeTechnicalElectives";

describe("eeTechnicalElectives", () => {
  it("recognizes track courses", () => {
    expect(isEeTrackTechnicalElective("ELEC_ENG 359-0")).toBe(true);
    expect(isEeTrackTechnicalElective("BMD_ENG 325-0")).toBe(true);
    expect(isEeTrackTechnicalElective("ELEC_ENG 202-0")).toBe(false);
  });

  it("recognizes design courses", () => {
    expect(isEeDesignCourse("ELEC_ENG 398-0")).toBe(true);
    expect(isEeDesignCourse("COMP_ENG 347-1")).toBe(true);
  });

  it("recognizes 300-level CEE electives", () => {
    expect(isEe300LevelCeeElective("COMP_ENG 205-0")).toBe(true);
    expect(isEe300LevelCeeElective("ELEC_ENG 335-0")).toBe(true);
    expect(isEe300LevelCeeElective("ELEC_ENG 221-0")).toBe(false);
  });

  it("recognizes ABET engineering topics courses", () => {
    expect(isAbetEngineeringTopicsCourse("IND_ENG 234-0")).toBe(true);
    expect(isAbetEngineeringTopicsCourse("MECH_ENG 333-0")).toBe(false);
    expect(isAbetEngineeringTopicsCourse("ELEC_ENG 202-0")).toBe(false);
    expect(isAbetEngineeringTopicsCourse("ELEC_ENG 101-0")).toBe(false);
  });
});
