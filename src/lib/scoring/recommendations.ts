import type {
  Assignment,
  FocusSession,
  ScoredAssignment,
  StudyPreferences,
  WorkloadRisk,
} from "../../types";
import { daysUntil } from "../dates";

const priorityWeights = {
  low: 8,
  medium: 18,
  high: 32,
};

export function scoreAssignments({
  assignments,
  focusSessions,
  preferences,
  availableMinutes,
  now = new Date(),
}: {
  assignments: Assignment[];
  focusSessions: FocusSession[];
  preferences?: StudyPreferences | null;
  availableMinutes?: number;
  now?: Date;
}): ScoredAssignment[] {
  const active = assignments.filter((assignment) => assignment.status !== "completed");
  const focusToday = focusSessions
    .filter((session) => daysUntil(session.startedAt, now) === 0)
    .reduce((sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes), 0);
  const maxDaily = preferences?.maxDailyStudyMinutes ?? 240;

  return active
    .map((assignment) => {
      const remainingMinutes = Math.max(assignment.remainingMinutes, 15);
      const daysLeft = daysUntil(assignment.dueAt, now);
      const urgency =
        daysLeft < 0 ? 80 : daysLeft === 0 ? 65 : Math.max(8, 55 / (daysLeft + 1));
      const workload = Math.min(30, remainingMinutes / 18);
      const priority = priorityWeights[assignment.priority];
      const fitBonus =
        availableMinutes && remainingMinutes <= availableMinutes
          ? 12
          : availableMinutes && remainingMinutes > availableMinutes * 2
            ? -8
            : 0;
      const fatiguePenalty =
        focusToday > maxDaily * 0.75 && remainingMinutes > 60 ? 18 : 0;

      const reasons = [
        daysLeft < 0
          ? "overdue"
          : daysLeft === 0
            ? "due today"
            : `due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        `${assignment.priority} priority`,
        `${remainingMinutes} minutes remaining`,
      ];

      if (fitBonus > 0) reasons.push("fits available time");
      if (fatiguePenalty > 0) reasons.push("reduced because of today's focus load");

      return {
        assignment,
        score: Math.round(urgency + workload + priority + fitBonus - fatiguePenalty),
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function estimateWorkloadRisk({
  assignments,
  focusSessions,
  preferences,
  now = new Date(),
}: {
  assignments: Assignment[];
  focusSessions: FocusSession[];
  preferences?: StudyPreferences | null;
  now?: Date;
}): WorkloadRisk {
  const dueThisWeekMinutes = assignments
    .filter((assignment) => {
      const daysLeft = daysUntil(assignment.dueAt, now);
      return assignment.status !== "completed" && daysLeft >= 0 && daysLeft <= 7;
    })
    .reduce((sum, assignment) => sum + assignment.remainingMinutes, 0);
  const focusToday = focusSessions
    .filter((session) => daysUntil(session.startedAt, now) === 0)
    .reduce((sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes), 0);
  const weeklyCapacity = (preferences?.maxDailyStudyMinutes ?? 240) * 5;

  if (focusToday > (preferences?.maxDailyStudyMinutes ?? 240)) return "high";
  if (dueThisWeekMinutes > weeklyCapacity * 0.85) return "high";
  if (dueThisWeekMinutes > weeklyCapacity * 0.55) return "medium";
  return "low";
}

export function deterministicRecommendation({
  assignments,
  focusSessions,
  preferences,
  availableMinutes,
}: {
  assignments: Assignment[];
  focusSessions: FocusSession[];
  preferences?: StudyPreferences | null;
  availableMinutes?: number;
}) {
  const scored = scoreAssignments({
    assignments,
    focusSessions,
    preferences,
    availableMinutes,
  });
  const best = scored[0];
  const risk = estimateWorkloadRisk({ assignments, focusSessions, preferences });

  if (!best) {
    return {
      nextAssignmentId: undefined,
      confidence: 90,
      suggestedSessionMinutes: preferences?.preferredSessionMinutes ?? 25,
      workloadRisk: risk,
      explanation: "You do not have any active assignments. Add a task or use this time for review.",
    };
  }

  const suggestedSessionMinutes = Math.min(
    best.assignment.remainingMinutes,
    preferences?.preferredSessionMinutes ?? 25,
    availableMinutes ?? preferences?.preferredSessionMinutes ?? 25,
  );

  return {
    nextAssignmentId: best.assignment.id,
    confidence: Math.min(95, 58 + Math.round(best.score / 3)),
    suggestedSessionMinutes: Math.max(15, suggestedSessionMinutes),
    workloadRisk: risk,
    explanation: `${best.assignment.title} is the best next task because it is ${best.reasons.join(", ")}.`,
  };
}
