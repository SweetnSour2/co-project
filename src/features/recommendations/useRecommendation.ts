import {
  type CollectionReference,
  type DocumentData,
  Timestamp,
  addDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { useMemo, useState } from "react";
import { isFirebaseConfigured } from "../../lib/firebase/client";
import { recommendationsCollection } from "../../lib/firebase/paths";
import { useCollection } from "../../lib/firebase/useCollection";
import {
  createLocalId,
  type LocalRecommendation,
  useLocalCollection,
} from "../../lib/local/demoStore";
import { deterministicRecommendation } from "../../lib/scoring/recommendations";
import type { Assignment, FocusSession, RecommendationOutput, StudyPreferences } from "../../types";
import { useAuth } from "../auth/AuthContext";

export function useRecommendation({
  assignments,
  focusSessions,
  preferences,
}: {
  assignments: Assignment[];
  focusSessions: FocusSession[];
  preferences: StudyPreferences | null;
}) {
  const { user } = useAuth();
  const constraints = useMemo(() => [orderBy("createdAt", "desc")], []);
  const ref = user && isFirebaseConfigured ? recommendationsCollection(user.uid) : null;
  const { data: recommendations } = useCollection(ref, constraints);
  const local = useLocalCollection<LocalRecommendation>(user?.uid, "recommendations");
  const [loading, setLoading] = useState(false);
  const fallback = deterministicRecommendation({
    assignments,
    focusSessions,
    preferences,
    availableMinutes: preferences?.preferredSessionMinutes,
  });
  const history = isFirebaseConfigured ? recommendations : local.items;
  const latest = history[0]?.output ?? fallback;

  async function generateRecommendation() {
    if (!user) return fallback;
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        local.setItems((items) => [
          {
            id: createLocalId(),
            type: "next_task",
            inputSnapshot: {
              source: "local_demo",
              assignmentCount: assignments.length,
              focusSessionCount: focusSessions.length,
            },
            output: fallback,
            model: "deterministic-local",
            createdAt: Timestamp.now(),
          },
          ...items,
        ]);
        return fallback;
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "next_task",
          availableMinutes: preferences?.preferredSessionMinutes ?? 25,
        }),
      });

      if (!response.ok) throw new Error("Recommendation API failed");
      const data = (await response.json()) as RecommendationOutput;
      return data;
    } catch {
      await addDoc(recommendationsCollection(user.uid) as CollectionReference<DocumentData>, {
        type: "next_task",
        inputSnapshot: {
          source: "client_fallback",
          assignmentCount: assignments.length,
          focusSessionCount: focusSessions.length,
        },
        output: fallback,
        model: "deterministic-fallback",
        createdAt: serverTimestamp(),
      });
      return fallback;
    } finally {
      setLoading(false);
    }
  }

  return {
    recommendation: latest,
    recommendationHistory: history,
    loading,
    generateRecommendation,
  };
}
