import {
  type CollectionReference,
  type DocumentData,
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useMemo } from "react";
import { assignmentsCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import type { Assignment, AssignmentStatus, Priority } from "../../types";
import { useAuth } from "../auth/AuthContext";

export interface AssignmentInput {
  title: string;
  courseId?: string;
  courseName?: string;
  dueDate: string;
  priority: Priority;
  estimatedMinutes: number;
  notes?: string;
}

export function useAssignments() {
  const { user } = useAuth();
  const constraints = useMemo(() => [orderBy("dueAt", "asc")], []);
  const ref = user ? assignmentsCollection(user.uid) : null;
  const { data: assignments, loading, error } = useCollection(ref, constraints);

  async function addAssignment(input: AssignmentInput) {
    if (!user) return;
    await addDoc(assignmentsCollection(user.uid) as CollectionReference<DocumentData>, {
      title: input.title,
      courseId: input.courseId ?? "",
      courseName: input.courseName ?? "",
      dueAt: Timestamp.fromDate(new Date(`${input.dueDate}T23:59:00`)),
      priority: input.priority,
      estimatedMinutes: input.estimatedMinutes,
      remainingMinutes: input.estimatedMinutes,
      status: "todo",
      notes: input.notes ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateAssignment(assignmentId: string, input: Partial<AssignmentInput>) {
    if (!user) return;
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (input.title !== undefined) payload.title = input.title;
    if (input.courseId !== undefined) payload.courseId = input.courseId;
    if (input.courseName !== undefined) payload.courseName = input.courseName;
    if (input.dueDate !== undefined) {
      payload.dueAt = Timestamp.fromDate(new Date(`${input.dueDate}T23:59:00`));
    }
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.estimatedMinutes !== undefined) {
      payload.estimatedMinutes = input.estimatedMinutes;
      payload.remainingMinutes = input.estimatedMinutes;
    }
    if (input.notes !== undefined) payload.notes = input.notes;

    await updateDoc(doc(assignmentsCollection(user.uid), assignmentId), payload);
  }

  async function setAssignmentStatus(assignment: Assignment, status: AssignmentStatus) {
    if (!user) return;
    await updateDoc(doc(assignmentsCollection(user.uid), assignment.id), {
      status,
      completedAt: status === "completed" ? serverTimestamp() : null,
      remainingMinutes: status === "completed" ? 0 : assignment.remainingMinutes,
      updatedAt: serverTimestamp(),
    });
  }

  async function reduceRemainingMinutes(assignment: Assignment, minutes: number) {
    if (!user) return;
    const remainingMinutes = Math.max(0, assignment.remainingMinutes - minutes);
    await updateDoc(doc(assignmentsCollection(user.uid), assignment.id), {
      remainingMinutes,
      status: remainingMinutes === 0 ? "completed" : "in_progress",
      completedAt: remainingMinutes === 0 ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteAssignment(assignmentId: string) {
    if (!user) return;
    await deleteDoc(doc(assignmentsCollection(user.uid), assignmentId));
  }

  return {
    assignments,
    loading,
    error,
    addAssignment,
    updateAssignment,
    setAssignmentStatus,
    reduceRemainingMinutes,
    deleteAssignment,
  };
}
