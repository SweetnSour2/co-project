import { AlertTriangle, ArrowRight, RefreshCw, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { useAssignments } from "../features/assignments/useAssignments";
import { useAuth } from "../features/auth/AuthContext";
import { useFocusSessions } from "../features/focusSessions/useFocusSessions";
import { useRecommendation } from "../features/recommendations/useRecommendation";
import { formatDueDate, minutesToHours } from "../lib/dates";
import { estimateWorkloadRisk } from "../lib/scoring/recommendations";

export function DashboardPage() {
  const { profile, preferences } = useAuth();
  const { assignments } = useAssignments();
  const { sessions } = useFocusSessions();
  const { recommendation, loading, generateRecommendation } = useRecommendation({
    assignments,
    focusSessions: sessions,
    preferences,
  });
  const nextTask = assignments.find((assignment) => assignment.id === recommendation.nextAssignmentId);
  const activeAssignments = assignments.filter((assignment) => assignment.status !== "completed");
  const upcoming = activeAssignments.slice(0, 5);
  const focusToday = sessions
    .filter((session) => session.startedAt.toDate().toDateString() === new Date().toDateString())
    .reduce((sum, session) => sum + (session.actualMinutes ?? session.plannedMinutes), 0);
  const risk = estimateWorkloadRisk({ assignments, focusSessions: sessions, preferences });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Daily command center
          </p>
          <h1 className="text-3xl font-black text-slate-950">
            Good to see you, {profile?.displayName ?? "Student"}
          </h1>
          <p className="mt-2 text-slate-600">
            You have {activeAssignments.length} active assignment
            {activeAssignments.length === 1 ? "" : "s"} and {minutesToHours(focusToday)} logged today.
          </p>
        </div>
        <Button onClick={generateRecommendation} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh plan
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="bg-slate-950 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            Recommended next task
          </p>
          {nextTask ? (
            <>
              <h2 className="mt-3 text-3xl font-black">{nextTask.title}</h2>
              <p className="mt-3 max-w-2xl text-slate-300">{recommendation.explanation}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/focus?assignmentId=${nextTask.id}`}>
                  <Button className="bg-white text-slate-950 hover:bg-slate-100">
                    <Timer className="mr-2 h-4 w-4" />
                    Start {recommendation.suggestedSessionMinutes ?? 25} min focus
                  </Button>
                </Link>
                <Link to="/assignments">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Edit tasks <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-3xl font-black">Add your first assignment</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                The planner needs deadlines, priorities, and estimates before it can recommend
                what to work on next.
              </p>
              <Link className="mt-6 inline-block" to="/assignments">
                <Button className="bg-white text-slate-950 hover:bg-slate-100">
                  Add assignments
                </Button>
              </Link>
            </>
          )}
        </Card>

        <Card>
          <CardTitle title="Workload status" eyebrow="Burnout guard" />
          <div
            className={`rounded-2xl p-4 ${
              risk === "high"
                ? "bg-rose-50 text-rose-700"
                : risk === "medium"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <div className="flex items-center gap-2 font-bold capitalize">
              <AlertTriangle className="h-4 w-4" />
              {risk} risk
            </div>
            <p className="mt-2 text-sm">
              {risk === "high"
                ? "Your near-term workload is heavy. Keep sessions shorter and schedule breaks."
                : risk === "medium"
                  ? "You have a manageable but meaningful workload this week."
                  : "Your workload looks balanced right now."}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle title="Suggested study blocks" eyebrow="Today" />
          <div className="grid gap-3">
            {recommendation.scheduleBlocks?.length ? (
              recommendation.scheduleBlocks.map((block) => {
                const assignment = assignments.find((item) => item.id === block.assignmentId);
                return (
                  <div key={`${block.assignmentId}-${block.timing}`} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-950">{assignment?.title ?? "Study block"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {block.timing ?? "Next available window"} ·{" "}
                      {block.durationMinutes ? minutesToHours(block.durationMinutes) : "Flexible"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{block.reason}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Refresh your plan to generate study blocks.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle title="Upcoming deadlines" eyebrow="Next up" />
          <div className="grid gap-3">
            {upcoming.length ? (
              upcoming.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{assignment.title}</p>
                    <p className="text-sm text-slate-500">
                      {assignment.courseName || "No course"} · {minutesToHours(assignment.remainingMinutes)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {formatDueDate(assignment.dueAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No active deadlines. Nice work.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
