import type { Timestamp } from "firebase/firestore";

export type Priority = "low" | "medium" | "high";
export type AssignmentStatus = "todo" | "in_progress" | "completed";
export type BurnoutSensitivity = "low" | "medium" | "high";
export type FocusSessionStatus = "completed" | "abandoned";
export type WorkloadRisk = "low" | "medium" | "high";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  onboardingCompleted: boolean;
}

export interface StudyPreferences {
  preferredStudyStartHour: number;
  preferredStudyEndHour: number;
  preferredSessionMinutes: number;
  burnoutSensitivity: BurnoutSensitivity;
  maxDailyStudyMinutes: number;
  updatedAt: Timestamp;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Assignment {
  id: string;
  title: string;
  courseId?: string;
  courseName?: string;
  dueAt: Timestamp;
  priority: Priority;
  estimatedMinutes: number;
  remainingMinutes: number;
  status: AssignmentStatus;
  notes?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FocusSession {
  id: string;
  assignmentId?: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  plannedMinutes: number;
  actualMinutes?: number;
  status: FocusSessionStatus;
  focusRating?: number;
  createdAt: Timestamp;
}

export interface ScheduleBlock {
  assignmentId: string;
  startAt?: string;
  endAt?: string;
  durationMinutes?: number;
  timing?: string;
  reason: string;
}

export interface RecommendationOutput {
  nextAssignmentId?: string;
  confidence?: number;
  suggestedSessionMinutes?: number;
  scheduleBlocks?: ScheduleBlock[];
  breakMinutes?: number;
  shouldStopForDay?: boolean;
  workloadRisk?: WorkloadRisk;
  explanation: string;
}

export interface Recommendation {
  id: string;
  type: "next_task" | "schedule" | "break" | "workload";
  inputSnapshot: Record<string, unknown>;
  output: RecommendationOutput;
  model?: string;
  createdAt: Timestamp;
}

export interface ScoredAssignment {
  assignment: Assignment;
  score: number;
  reasons: string[];
}
