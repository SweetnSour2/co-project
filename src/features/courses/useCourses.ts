import {
  type CollectionReference,
  type DocumentData,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { useMemo } from "react";
import { isFirebaseConfigured } from "../../lib/firebase/client";
import { coursesCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import {
  createLocalId,
  type LocalCourse,
  useLocalCollection,
} from "../../lib/local/demoStore";
import { useAuth } from "../auth/AuthContext";

const palette = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9"];

export function useCourses() {
  const { user } = useAuth();
  const constraints = useMemo(() => [orderBy("name", "asc")], []);
  const ref = user && isFirebaseConfigured ? coursesCollection(user.uid) : null;
  const { data: courses, loading, error } = useCollection(ref, constraints);
  const local = useLocalCollection<LocalCourse>(user?.uid, "courses");

  async function addCourse(input: { name: string; code?: string; color?: string }) {
    if (!user) return;
    if (!isFirebaseConfigured) {
      local.setItems((items) => [
        ...items,
        {
          id: createLocalId(),
          name: input.name,
          code: input.code ?? "",
          color: input.color ?? palette[Math.floor(Math.random() * palette.length)],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ]);
      return;
    }

    await addDoc(coursesCollection(user.uid) as CollectionReference<DocumentData>, {
      name: input.name,
      code: input.code ?? "",
      color: input.color ?? palette[Math.floor(Math.random() * palette.length)],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function updateCourse(courseId: string, input: { name: string; code?: string; color?: string }) {
    if (!user) return;
    if (!isFirebaseConfigured) {
      local.setItems((items) =>
        items.map((course) =>
          course.id === courseId ? { ...course, ...input, updatedAt: Timestamp.now() } : course,
        ),
      );
      return;
    }

    await updateDoc(doc(coursesCollection(user.uid), courseId), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteCourse(courseId: string) {
    if (!user) return;
    if (!isFirebaseConfigured) {
      local.setItems((items) => items.filter((course) => course.id !== courseId));
      return;
    }

    await deleteDoc(doc(coursesCollection(user.uid), courseId));
  }

  return {
    courses: isFirebaseConfigured ? courses : local.items,
    loading: isFirebaseConfigured ? loading : false,
    error: isFirebaseConfigured ? error : null,
    addCourse,
    updateCourse,
    deleteCourse,
  };
}
