import { ArrowRight, Brain, CalendarDays, ShieldCheck, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-black text-slate-950">StudyPilot AI</span>
        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-600" to="/auth">
            Log in
          </Link>
          <Link to="/auth">
            <Button>Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-600">
            AI planning for students
          </p>
          <h1 className="text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Stop guessing. Start with the right assignment.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            StudyPilot turns deadlines, priorities, estimates, completed work,
            and focus history into a daily plan that protects your energy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button className="gap-2">
                Build my plan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary">See MVP features</Button>
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-brand-600">Recommended next</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Finish calculus problem set</h2>
          <p className="mt-3 text-slate-600">
            Due tomorrow, high priority, and fits your 45-minute window before dinner.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-brand-50 p-4 text-sm font-medium text-brand-700">
              4:00-4:45 PM Deep work
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600">
              4:45-5:00 PM Recovery break
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-4">
        {[
          { icon: Brain, title: "Next task AI", body: "Explainable recommendations." },
          { icon: CalendarDays, title: "Study blocks", body: "Simple, realistic plans." },
          { icon: TimerReset, title: "Focus sessions", body: "Record effort and breaks." },
          { icon: ShieldCheck, title: "Private by default", body: "User-scoped Firestore data." },
        ].map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-5">
            <feature.icon className="h-6 w-6 text-brand-600" />
            <h3 className="mt-4 font-bold text-slate-950">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{feature.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
