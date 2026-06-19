import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import type { Assignment, FocusSession } from "../../types";
import { deterministicRecommendation, scoreAssignments } from "./recommendations";

const baseAssignment = {
  courseName: "Calculus",
  estimatedMinutes: 60,
  remainingMinutes: 60,
  status: "todo",
  notes: "",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
} satisfies Partial<Assignment>;

function assignment(input: Partial<Assignment> & Pick<Assignment, "id" | "title">): Assignment {
  return {
    ...baseAssignment,
    priority: "medium",
    dueAt: Timestamp.fromDate(new Date("2026-06-20T23:59:00")),
    ...input,
  } as Assignment;
}

describe("recommendation scoring", () => {
  it("prioritizes urgent high-priority assignments", () => {
    const scored = scoreAssignments({
      assignments: [
        assignment({
          id: "later",
          title: "Low stakes reading",
          priority: "low",
          dueAt: Timestamp.fromDate(new Date("2026-06-28T23:59:00")),
        }),
        assignment({
          id: "urgent",
          title: "Final project",
          priority: "high",
          dueAt: Timestamp.fromDate(new Date("2026-06-20T23:59:00")),
        }),
      ],
      focusSessions: [],
      now: new Date("2026-06-19T12:00:00"),
    });

    expect(scored[0].assignment.id).toBe("urgent");
  });

  it("returns a usable fallback when no assignments are active", () => {
    const recommendation = deterministicRecommendation({
      assignments: [
        assignment({
          id: "done",
          title: "Submitted essay",
          status: "completed",
        }),
      ],
      focusSessions: [] as FocusSession[],
    });

    expect(recommendation.nextAssignmentId).toBeUndefined();
    expect(recommendation.explanation).toContain("do not have any active assignments");
  });
});
