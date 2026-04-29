/**
 * Status of a course in relation to degree completion.
 * - "completed": Course finished with a passing grade
 * - "in_progress": Currently enrolled (grade not yet assigned)
 * - "transfer": Credit transferred from another institution
 * - "not_taken": Course requirement not yet fulfilled
 */
export type CourseStatus = "completed" | "in_progress" | "transfer" | "not_taken";

/**
 * Represents a single course extracted from a Northwestern University transcript PDF.
 * Contains all metadata about the course including enrollment term, grade, and units.
 */
export interface ParsedCourse {
  /** Course code (e.g. "COMP_SCI 111-0") */
  code: string;
  
  /** Full course name (e.g. "Fundamentals of Computer Programming") */
  name: string;
  
  /** Number of units attempted (typically 1.0 for most courses) */
  attempted: number;
  
  /** Number of units earned (0 if in progress or failed) */
  earned: number;
  
  /** Letter grade received (e.g. "A", "A-", "B+", "T" for transfer, "K" for in progress) */
  grade: string;
  
  /** Academic term (e.g. "2025 Fall", "2024 Winter") */
  term: string;
  
  /** Current status of the course */
  status: CourseStatus;
}

/**
 * Represents a course requirement within a degree program.
 * Can be a specific required course or a flexible elective slot.
 */
export interface RequirementCourse {
  /** 
   * Course code to match against (e.g. "COMP_SCI 111-0").
   * Empty string if this is an elective slot.
   */
  code: string;
  
  /** Course name or description */
  name: string;
  
  /** Number of units this course is worth (typically 1.0) */
  units: number;
  
  /** 
   * If true, this is a flexible slot that can be satisfied by multiple courses.
   * Optional - defaults to false.
   */
  isElective?: boolean;
  
  /** 
   * Description of what satisfies this elective slot.
   * e.g. "Any 300+ level COMP_SCI/ELEC_ENG/COMP_ENG course"
   * Optional - only present if isElective is true.
   */
  electiveDescription?: string;
  
  /** 
   * Alternative course codes that satisfy the same requirement.
   * e.g. ["COMP_SCI 150-0"] as alternative to "COMP_SCI 211-0"
   * Optional - only present if multiple specific courses satisfy the slot.
   */
  alternatives?: string[];
}

/**
 * Represents a category of degree requirements (e.g. "Mathematics", "Core CS").
 * Contains all courses required within this category.
 */
export interface Requirement {
  /** Unique identifier slug (e.g. "mccormick-math", "cs-minor-core") */
  id: string;
  
  /** Display name for the requirement category (e.g. "Mathematics", "Core Computer Science") */
  category: string;
  
  /** Which degree program this requirement belongs to */
  degree: "EE" | "CS_MINOR" | "MCCORMICK_CORE";
  
  /** Total units required in this category */
  totalUnits: number;
  
  /** List of courses that fulfill this requirement */
  courses: RequirementCourse[];
  
  /** 
   * Optional explanation shown in UI (e.g. "Choose 2 courses from the following list")
   */
  description?: string;
}

/**
 * Extends Requirement with computed audit results showing which courses
 * have been matched and what remains to be completed.
 */
export interface MatchedRequirement extends Requirement {
  /** Number of units completed in this requirement category */
  completedUnits: number;
  
  /** Number of units currently in progress */
  inProgressUnits: number;
  
  /** 
   * Courses from the transcript that matched requirements in this category.
   * Maps each ParsedCourse to the RequirementCourse it satisfied.
   */
  matchedCourses: Array<{
    /** The student's course from their transcript */
    course: ParsedCourse;
    
    /** The requirement course code this satisfies (e.g. "COMP_SCI 111-0") */
    requirementCourseCode: string;
  }>;
  
  /** Requirement courses that have not yet been satisfied */
  unmetCourses: RequirementCourse[];
}

/**
 * Top-level result of a degree audit.
 * Contains student information and all matched requirements with their completion status.
 */
export interface AuditResult {
  /** Student's full name extracted from transcript */
  studentName: string;
  
  /** Cumulative GPA as a string (e.g. "3.85") */
  gpa: string;
  
  /** All degree requirements with their match results */
  requirements: MatchedRequirement[];
  
  /** 
   * Courses that count toward multiple requirements (double-counted).
   * Tracks which requirement categories each double-counted course satisfies.
   */
  doubleCounts: Array<{
    /** The course that satisfies multiple requirements */
    course: ParsedCourse;
    
    /** Array of requirement IDs this course counts toward */
    satisfiesIds: string[];
  }>;
}