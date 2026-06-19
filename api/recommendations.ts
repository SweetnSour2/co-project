import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({
  type: z.enum(["next_task", "schedule", "break"]).default("next_task"),
  availableMinutes: z.number().min(10).max(240).default(25),
});

const outputSchema = z.object({
  nextAssignmentId: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  suggestedSessionMinutes: z.number().min(5).max(240).optional(),
  scheduleBlocks: z
    .array(
      z.object({
        assignmentId: z.string(),
        durationMinutes: z.number().optional(),
        timing: z.string().optional(),
        reason: z.string(),
      }),
    )
    .optional(),
  breakMinutes: z.number().min(0).max(60).optional(),
  workloadRisk: z.enum(["low", "medium", "high"]).optional(),
  explanation: z.string(),
});

function initAdmin() {
  if (getApps().length) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function daysUntil(date: Date, now = new Date()) {
  const day = 1000 * 60 * 60 * 24;
  return Math.ceil((date.getTime() - now.getTime()) / day);
}

function deterministic(assignments: FirebaseFirestore.QueryDocumentSnapshot[], availableMinutes: number) {
  const priorityWeights = { low: 8, medium: 18, high: 32 };
  const scored = assignments
    .map((docSnapshot) => {
      const data = docSnapshot.data();
      const dueAt = data.dueAt?.toDate?.() ?? new Date();
      const daysLeft = daysUntil(dueAt);
      const remainingMinutes = Math.max(Number(data.remainingMinutes ?? 30), 15);
      const urgency =
        daysLeft < 0 ? 80 : daysLeft === 0 ? 65 : Math.max(8, 55 / (daysLeft + 1));
      const score =
        urgency +
        priorityWeights[(data.priority as "low" | "medium" | "high") ?? "medium"] +
        Math.min(30, remainingMinutes / 18) +
        (remainingMinutes <= availableMinutes ? 12 : 0);

      return {
        id: docSnapshot.id,
        title: String(data.title),
        dueAt,
        daysLeft,
        remainingMinutes,
        score,
        priority: data.priority,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) {
    return {
      confidence: 90,
      suggestedSessionMinutes: availableMinutes,
      workloadRisk: "low" as const,
      explanation: "You do not have any active assignments. Add one or use this time for review.",
    };
  }

  const workloadRisk =
    scored.reduce((sum, item) => sum + (item.daysLeft <= 7 ? item.remainingMinutes : 0), 0) > 900
      ? "high"
      : "medium";

  return {
    nextAssignmentId: best.id,
    confidence: Math.min(95, 60 + Math.round(best.score / 3)),
    suggestedSessionMinutes: Math.max(15, Math.min(best.remainingMinutes, availableMinutes)),
    scheduleBlocks: [
      {
        assignmentId: best.id,
        durationMinutes: Math.max(15, Math.min(best.remainingMinutes, availableMinutes)),
        timing: "Next available study window",
        reason: "Highest combined urgency, priority, and fit score.",
      },
    ],
    breakMinutes: availableMinutes >= 45 ? 15 : 5,
    workloadRisk,
    explanation: `${best.title} is the strongest next task because it is ${best.priority} priority and due ${
      best.daysLeft <= 0 ? "now" : `in ${best.daysLeft} day${best.daysLeft === 1 ? "" : "s"}`
    }.`,
  };
}

async function callOpenAI(input: {
  fallback: ReturnType<typeof deterministic>;
  assignments: Array<Record<string, unknown>>;
  focusSessions: Array<Record<string, unknown>>;
  availableMinutes: number;
}) {
  if (!process.env.OPENAI_API_KEY) return input.fallback;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are an academic planning assistant. Return only JSON that matches the schema. Use the deterministic recommendation unless there is a clear reason to adjust the explanation or break guidance. Be concise and student-friendly.",
      },
      {
        role: "user",
        content: JSON.stringify({
          availableMinutes: input.availableMinutes,
          deterministicRecommendation: input.fallback,
          assignments: input.assignments,
          focusSessions: input.focusSessions,
          schema: {
            nextAssignmentId: "string optional",
            confidence: "0-100",
            suggestedSessionMinutes: "number",
            scheduleBlocks: "array of assignmentId, durationMinutes, timing, reason",
            breakMinutes: "number",
            workloadRisk: "low | medium | high",
            explanation: "string",
          },
        }),
      },
    ],
  });

  const text = response.output_text;
  return outputSchema.parse(JSON.parse(text));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    initAdmin();
    const parsed = requestSchema.parse(req.body);
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ error: "Missing auth token" });
      return;
    }

    const decoded = await getAuth().verifyIdToken(token);
    const firestore = getFirestore();
    const base = firestore.collection("users").doc(decoded.uid);
    const [assignmentsSnapshot, sessionsSnapshot] = await Promise.all([
      base.collection("assignments").where("status", "!=", "completed").get(),
      base.collection("focusSessions").orderBy("startedAt", "desc").limit(20).get(),
    ]);

    const fallback = deterministic(assignmentsSnapshot.docs, parsed.availableMinutes);
    const assignments = assignmentsSnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: data.title,
        priority: data.priority,
        dueAt: data.dueAt?.toDate?.()?.toISOString?.(),
        remainingMinutes: data.remainingMinutes,
      };
    });
    const focusSessions = sessionsSnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        assignmentId: data.assignmentId,
        actualMinutes: data.actualMinutes,
        plannedMinutes: data.plannedMinutes,
        status: data.status,
      };
    });
    const output = await callOpenAI({
      fallback,
      assignments,
      focusSessions,
      availableMinutes: parsed.availableMinutes,
    });

    const validIds = new Set(assignmentsSnapshot.docs.map((docSnapshot) => docSnapshot.id));
    if (output.nextAssignmentId && !validIds.has(output.nextAssignmentId)) {
      output.nextAssignmentId = fallback.nextAssignmentId;
    }

    await base.collection("recommendations").add({
      type: parsed.type,
      inputSnapshot: {
        assignmentCount: assignmentsSnapshot.size,
        focusSessionCount: sessionsSnapshot.size,
        availableMinutes: parsed.availableMinutes,
      },
      output,
      model: process.env.OPENAI_API_KEY
        ? (process.env.OPENAI_MODEL ?? "gpt-4.1-mini")
        : "deterministic-fallback",
      createdAt: Timestamp.now(),
    });

    res.status(200).json(output);
  } catch (error) {
    res.status(500).json({
      error: "Unable to generate recommendation",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
