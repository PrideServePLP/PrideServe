import type { ClassBlock } from "./types";
import type { HonorSociety } from "./database.types";

export const GRADE_LEVELS = ["9th", "10th", "11th", "12th"] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const HONOR_SOCIETIES: HonorSociety[] = [
  "NHS",
  "NJHS",
  "Beta Club",
  "Spanish Honor Society",
  "Science National Honor Society",
];

export const CLASS_BLOCKS: ClassBlock[] = ["A", "B", "C", "D", "E", "F"];
