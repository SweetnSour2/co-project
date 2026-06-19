import { Pause, Play, Square, TimerReset } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Field, Select } from "../components/ui/Field";
import { useAssignments } from "../features/assignments/useAssignments";
import { useAuth } from "../features/auth/AuthContext";
import { useFocusSessions } from "../features/focusSessions/useFocusSessions";
import { minutesToHours } from "../lib/dates";

export function FocusPage() {
  const { preferences } = useAuth();
  const { assignments, reduceRemainingMinutes } = useAssignments();
  const { sessions, startSession, finishSession } = useFocusSessions();
  const [searchParams] = useSearchParams();
  const activeAssignments = assignments.filter((assignment) => assignment.status !== "completed");
  const [assignmentId, setAssignmentId] = useState(searchParams.get("assignmentId") ?? "");
  const selectedAssignment = activeAssignments.find((assignment) => assignment.id === assignmentId);
  const plannedMinutes = Math.min(
    selectedAssignment?.remainingMinutes ?? preferences?.preferredSessionMinutes ?? 25,
    preferences?.preferredSessionMinutes ?? 25,
  );
  const [secondsLeft, setSecondsLeft] = useState(plannedMinutes * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [breakMessage, setBreakMessage] = useState("");

  useEffect(() => {
    setSecondsLeft(plannedMinutes * 60);
  }, [plannedMinutes, assignmentId]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const displayTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  async function handleStart() {
    if (!sessionId) {
      const createdSessionId = await startSession({ assignmentId, plannedMinutes });
      setSessionId(createdSessionId);
    }
    setRunning(true);
    setBreakMessage("");
  }

  const completeSession = useCallback(async () => {
    if (!sessionId) return;
    setRunning(false);
    const actualMinutes = Math.max(1, Math.round((plannedMinutes * 60 - secondsLeft) / 60));
    await finishSession(sessionId, {
      actualMinutes,
      status: "completed",
      focusRating: 4,
    });
    if (selectedAssignment) {
      await reduceRemainingMinutes(selectedAssignment, actualMinutes);
    }
    setSessionId(null);
    setBreakMessage(
      actualMinutes >= 45
        ? "Take a 15-minute recovery break before starting another deep task."
        : "Take a 5-minute reset break. Stand up, hydrate, and avoid starting a new tab.",
    );
  }, [
    finishSession,
    plannedMinutes,
    reduceRemainingMinutes,
    secondsLeft,
    selectedAssignment,
    sessionId,
  ]);

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      void completeSession();
    }
  }, [completeSession, secondsLeft, running]);

  async function abandonSession() {
    if (sessionId) {
      const actualMinutes = Math.max(1, Math.round((plannedMinutes * 60 - secondsLeft) / 60));
      await finishSession(sessionId, { actualMinutes, status: "abandoned", focusRating: 2 });
    }
    setRunning(false);
    setSessionId(null);
    setSecondsLeft(plannedMinutes * 60);
    setBreakMessage("No problem. Try a shorter task or a 5-minute reset before restarting.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <Card className="grid min-h-[520px] place-items-center text-center">
        <div className="w-full max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Focus session
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {selectedAssignment?.title ?? "Choose a task to begin"}
          </h1>
          <p className="mt-2 text-slate-500">
            {selectedAssignment
              ? `${minutesToHours(selectedAssignment.remainingMinutes)} remaining`
              : "A focused session starts from a real assignment."}
          </p>
          <div className="my-10 text-7xl font-black tabular-nums text-slate-950 md:text-8xl">
            {displayTime}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button disabled={!selectedAssignment} onClick={handleStart}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button variant="secondary" disabled={!sessionId} onClick={() => setRunning(false)}>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button variant="secondary" disabled={!sessionId} onClick={completeSession}>
              <Square className="mr-2 h-4 w-4" />
              Complete
            </Button>
            <Button variant="ghost" disabled={!sessionId} onClick={abandonSession}>
              Reset
            </Button>
          </div>
          {breakMessage ? (
            <div className="mt-8 rounded-2xl bg-brand-50 p-4 text-sm font-medium text-brand-700">
              {breakMessage}
            </div>
          ) : null}
        </div>
      </Card>

      <aside className="grid content-start gap-6">
        <Card>
          <CardTitle title="Session setup" eyebrow="Before you start" />
          <Field label="Assignment">
            <Select value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)}>
              <option value="">Select assignment</option>
              {activeAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-950">
              <TimerReset className="h-4 w-4 text-brand-600" />
              Planned session
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {minutesToHours(plannedMinutes)} based on your preference and task remaining time.
            </p>
          </div>
        </Card>

        <Card>
          <CardTitle title="Recent sessions" eyebrow="Focus history" />
          <div className="grid gap-3">
            {sessions.slice(0, 5).map((session) => {
              const assignment = assignments.find((item) => item.id === session.assignmentId);
              return (
                <div key={session.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-950">
                    {assignment?.title ?? "Unassigned focus"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {minutesToHours(session.actualMinutes ?? session.plannedMinutes)} ·{" "}
                    {session.status}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </aside>
    </div>
  );
}
