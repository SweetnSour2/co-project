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
import { isFirebaseConfigured } from "../../lib/firebase/client";
import { focusSessionsCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import {
  createLocalId,
  type LocalFocusSession,
  useLocalCollection,
} from "../../lib/local/demoStore";
import { useAuth } from "../auth/AuthContext";

export function useFocusSessions() {
  const { user } = useAuth();
  const constraints = useMemo(() => [orderBy("startedAt", "desc")], []);
  const ref = user && isFirebaseConfigured ? focusSessionsCollection(user.uid) : null;
  const { data: sessions, loading, error } = useCollection(ref, constraints);
  const local = useLocalCollection<LocalFocusSession>(user?.uid, "focusSessions");

  async function startSession(input: { assignmentId?: string; plannedMinutes: number }) {
    if (!user) return null;
    if (!isFirebaseConfigured) {
      const id = createLocalId();
      local.setItems((items) => [
        {
          id,
          assignmentId: input.assignmentId ?? "",
          startedAt: Timestamp.now(),
          plannedMinutes: input.plannedMinutes,
          status: "abandoned",
          createdAt: Timestamp.now(),
        },
        ...items,
      ]);
      return id;
    }

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
    if (!isFirebaseConfigured) {
      local.setItems((items) =>
        items.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                endedAt: Timestamp.now(),
                actualMinutes: input.actualMinutes,
                status: input.status,
                focusRating: input.focusRating,
              }
            : session,
        ),
      );
      return;
    }

    await updateDoc(doc(focusSessionsCollection(user.uid), sessionId), {
      endedAt: Timestamp.now(),
      actualMinutes: input.actualMinutes,
      status: input.status,
      focusRating: input.focusRating ?? null,
    });
  }

  return {
    sessions: isFirebaseConfigured ? sessions : local.items,
    loading: isFirebaseConfigured ? loading : false,
    error: isFirebaseConfigured ? error : null,
    startSession,
    finishSession,
  };
}
