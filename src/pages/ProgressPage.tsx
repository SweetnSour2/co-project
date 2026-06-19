import { CheckCircle2, Clock, Flame } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { useAssignments } from "../features/assignments/useAssignments";
import { useFocusSessions } from "../features/focusSessions/useFocusSessions";
import { minutesToHours } from "../lib/dates";

export function ProgressPage() {
  const { assignments } = useAssignments();
  const { sessions } = useFocusSessions();
  const completedAssignments = assignments.filter((assignment) => assignment.status === "completed");
  const totalFocus = sessions.reduce(
    (sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes),
    0,
  );
  const completedSessions = sessions.filter((session) => session.status === "completed");
  const completionRate = sessions.length
    ? Math.round((completedSessions.length / sessions.length) * 100)
    : 0;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Progress
        </p>
        <h1 className="text-3xl font-black text-slate-950">Your study momentum</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <Clock className="h-6 w-6 text-brand-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{minutesToHours(totalFocus)}</p>
          <p className="text-sm text-slate-500">Total focus logged</p>
        </Card>
        <Card>
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">
            {completedAssignments.length}
          </p>
          <p className="text-sm text-slate-500">Assignments completed</p>
        </Card>
        <Card>
          <Flame className="h-6 w-6 text-amber-600" />
          <p className="mt-4 text-3xl font-black text-slate-950">{completionRate}%</p>
          <p className="text-sm text-slate-500">Focus completion rate</p>
        </Card>
      </div>

      <Card>
        <CardTitle title="Recent focus history" eyebrow="Latest sessions" />
        <div className="grid gap-3">
          {sessions.length ? (
            sessions.slice(0, 10).map((session) => {
              const assignment = assignments.find((item) => item.id === session.assignmentId);
              return (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {assignment?.title ?? "Unassigned focus"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {session.startedAt.toDate().toLocaleDateString()} · {session.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                    {minutesToHours(session.actualMinutes ?? session.plannedMinutes)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">
              Start a focus session to see progress here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
