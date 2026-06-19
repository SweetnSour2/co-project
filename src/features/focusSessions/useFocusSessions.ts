import {
  type CollectionReference,
  type DocumentData,
  Timestamp,
  addDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useMemo } from "react";
import { focusSessionsCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import { useAuth } from "../auth/AuthContext";

export function useFocusSessions() {
  const { user } = useAuth();
  const constraints = useMemo(() => [orderBy("startedAt", "desc")], []);
  const ref = user ? focusSessionsCollection(user.uid) : null;
  const { data: sessions, loading, error } = useCollection(ref, constraints);

  async function startSession(input: { assignmentId?: string; plannedMinutes: number }) {
    if (!user) return null;
    const created = await addDoc(focusSessionsCollection(user.uid) as CollectionReference<DocumentData>, {
      assignmentId: input.assignmentId ?? "",
      startedAt: Timestamp.now(),
      plannedMinutes: input.plannedMinutes,
      status: "abandoned",
      createdAt: serverTimestamp(),
    });
    return created.id;
  }

  async function finishSession(
    sessionId: string,
    input: { actualMinutes: number; status: "completed" | "abandoned"; focusRating?: number },
  ) {
    if (!user) return;
    await updateDoc(doc(focusSessionsCollection(user.uid), sessionId), {
      endedAt: Timestamp.now(),
      actualMinutes: input.actualMinutes,
      status: input.status,
      focusRating: input.focusRating ?? null,
    });
  }

  return { sessions, loading, error, startSession, finishSession };
}
