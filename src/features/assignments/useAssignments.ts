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
import { isFirebaseConfigured } from "../../lib/firebase/client";
import { assignmentsCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import {
  createLocalId,
  type LocalAssignment,
  useLocalCollection,
} from "../../lib/local/demoStore";
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
  const ref = user && isFirebaseConfigured ? assignmentsCollection(user.uid) : null;
  const { data: assignments, loading, error } = useCollection(ref, constraints);
  const local = useLocalCollection<LocalAssignment>(user?.uid, "assignments");

  async function addAssignment(input: AssignmentInput) {
    if (!user) return;
    if (!isFirebaseConfigured) {
      local.setItems((items) =>
        [
          ...items,
          {
            id: createLocalId(),
            title: input.title,
            courseId: input.courseId ?? "",
            courseName: input.courseName ?? "",
            dueAt: Timestamp.fromDate(new Date(`${input.dueDate}T23:59:00`)),
            priority: input.priority,
            estimatedMinutes: input.estimatedMinutes,
            remainingMinutes: input.estimatedMinutes,
            status: "todo" as const,
            notes: input.notes ?? "",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ].sort((a, b) => a.dueAt.toMillis() - b.dueAt.toMillis()),
      );
      return;
    }

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
    if (!isFirebaseConfigured) {
      local.setItems((items) =>
        items
          .map((assignment) => {
            if (assignment.id !== assignmentId) return assignment;
            return {
              ...assignment,
              title: input.title ?? assignment.title,
              courseId: input.courseId ?? assignment.courseId,
              courseName: input.courseName ?? assignment.courseName,
              dueAt: input.dueDate
                ? Timestamp.fromDate(new Date(`${input.dueDate}T23:59:00`))
                : assignment.dueAt,
              priority: input.priority ?? assignment.priority,
              estimatedMinutes: input.estimatedMinutes ?? assignment.estimatedMinutes,
              remainingMinutes: input.estimatedMinutes ?? assignment.remainingMinutes,
              notes: input.notes ?? assignment.notes,
              updatedAt: Timestamp.now(),
            };
          })
          .sort((a, b) => a.dueAt.toMillis() - b.dueAt.toMillis()),
      );
      return;
    }

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
    if (!isFirebaseConfigured) {
      local.setItems((items) =>
        items.map((item) =>
          item.id === assignment.id
            ? {
                ...item,
                status,
                completedAt: status === "completed" ? Timestamp.now() : undefined,
                remainingMinutes: status === "completed" ? 0 : item.remainingMinutes,
                updatedAt: Timestamp.now(),
              }
            : item,
        ),
      );
      return;
    }

    await updateDoc(doc(assignmentsCollection(user.uid), assignment.id), {
      status,
      completedAt: status === "completed" ? serverTimestamp() : null,
      remainingMinutes: status === "completed" ? 0 : assignment.remainingMinutes,
      updatedAt: serverTimestamp(),
    });
  }

  async function reduceRemainingMinutes(assignment: Assignment, minutes: number) {
    if (!user) return;
    if (!isFirebaseConfigured) {
      local.setItems((items) =>
        items.map((item) => {
          if (item.id !== assignment.id) return item;
          const remainingMinutes = Math.max(0, item.remainingMinutes - minutes);
          return {
            ...item,
            remainingMinutes,
            status: remainingMinutes === 0 ? "completed" : "in_progress",
            completedAt: remainingMinutes === 0 ? Timestamp.now() : undefined,
            updatedAt: Timestamp.now(),
          };
        }),
      );
      return;
    }

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
    if (!isFirebaseConfigured) {
      local.setItems((items) => items.filter((assignment) => assignment.id !== assignmentId));
      return;
    }

    await deleteDoc(doc(assignmentsCollection(user.uid), assignmentId));
  }

  return {
    assignments: isFirebaseConfigured ? assignments : local.items,
    loading: isFirebaseConfigured ? loading : false,
    error: isFirebaseConfigured ? error : null,
    addAssignment,
    updateAssignment,
    setAssignmentStatus,
    reduceRemainingMinutes,
    deleteAssignment,
  };
}
