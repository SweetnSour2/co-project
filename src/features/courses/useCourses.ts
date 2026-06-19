import {
  type CollectionReference,
  type DocumentData,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useMemo } from "react";
import { coursesCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import { useAuth } from "../auth/AuthContext";

const palette = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#0ea5e9"];

export function useCourses() {
  const { user } = useAuth();
  const constraints = useMemo(() => [orderBy("name", "asc")], []);
  const ref = user ? coursesCollection(user.uid) : null;
  const { data: courses, loading, error } = useCollection(ref, constraints);

  async function addCourse(input: { name: string; code?: string; color?: string }) {
    if (!user) return;
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
    await updateDoc(doc(coursesCollection(user.uid), courseId), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteCourse(courseId: string) {
    if (!user) return;
    await deleteDoc(doc(coursesCollection(user.uid), courseId));
  }

  return { courses, loading, error, addCourse, updateCourse, deleteCourse };
}
