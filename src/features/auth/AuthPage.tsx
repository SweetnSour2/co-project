import { Brain, CalendarClock, TimerReset } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input } from "../../components/ui/Field";
import { useAuth } from "./AuthContext";

export function AuthPage() {
  const { user, profile, signUp, logIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user && profile?.onboardingCompleted) return <Navigate to="/dashboard" replace />;
  if (user) return <Navigate to="/onboarding" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(name || "Student", email, password);
      } else {
        await logIn(email, password);
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-8 text-ink">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="text-lg font-black text-slate-950">
          StudyPilot AI
        </Link>
        <Link to="/" className="text-sm font-medium text-slate-600">
          Back to home
        </Link>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-8 py-16 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-600">
            Student planning, made practical
          </p>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            Know what to work on next before you open another tab.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Add assignments, deadlines, and estimates. StudyPilot turns them into
            a focused next step, a realistic study block, and a break plan.
          </p>
          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            {[
              { icon: Brain, label: "Explainable recommendations" },
              { icon: CalendarClock, label: "Balanced study blocks" },
              { icon: TimerReset, label: "Focus sessions and breaks" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <item.icon className="mb-3 h-5 w-5 text-brand-600" />
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <Card>
          <h2 className="text-2xl font-bold text-slate-950">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "signup"
              ? "Start with a few preferences, then add your first assignments."
              : "Pick up where your study plan left off."}
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <Field label="Name">
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
            ) : null}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
            <Button disabled={submitting} type="submit">
              {submitting ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
            </Button>
          </form>

          <button
            className="mt-5 text-sm font-medium text-brand-700"
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup"
              ? "Already have an account? Log in"
              : "Need an account? Sign up"}
          </button>
        </Card>
      </div>
    </main>
  );
}
