import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input, Select } from "../../components/ui/Field";
import { useAuth } from "../auth/AuthContext";
import type { BurnoutSensitivity } from "../../types";

export function OnboardingPage() {
  const { profile, preferences, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [preferredStudyStartHour, setStartHour] = useState(
    preferences?.preferredStudyStartHour ?? 16,
  );
  const [preferredStudyEndHour, setEndHour] = useState(
    preferences?.preferredStudyEndHour ?? 21,
  );
  const [preferredSessionMinutes, setSessionMinutes] = useState(
    preferences?.preferredSessionMinutes ?? 25,
  );
  const [maxDailyStudyMinutes, setMaxDailyStudyMinutes] = useState(
    preferences?.maxDailyStudyMinutes ?? 240,
  );
  const [burnoutSensitivity, setBurnoutSensitivity] = useState<BurnoutSensitivity>(
    preferences?.burnoutSensitivity ?? "medium",
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    await completeOnboarding({
      displayName: displayName || "Student",
      preferredStudyStartHour,
      preferredStudyEndHour,
      preferredSessionMinutes,
      maxDailyStudyMinutes,
      burnoutSensitivity,
    });
    navigate("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 py-10 text-ink">
      <Card className="w-full max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-600">
          Step 1 of 1
        </p>
        <h1 className="text-3xl font-black text-slate-950">Set up your study rhythm</h1>
        <p className="mt-3 text-slate-600">
          These defaults help the planner recommend realistic session lengths,
          breaks, and workload warnings. You can change them later.
        </p>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
          <Field label="Name">
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred study start hour">
              <Input
                type="number"
                min={5}
                max={23}
                value={preferredStudyStartHour}
                onChange={(event) => setStartHour(Number(event.target.value))}
              />
            </Field>
            <Field label="Preferred study end hour">
              <Input
                type="number"
                min={6}
                max={24}
                value={preferredStudyEndHour}
                onChange={(event) => setEndHour(Number(event.target.value))}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred focus session">
              <Select
                value={preferredSessionMinutes}
                onChange={(event) => setSessionMinutes(Number(event.target.value))}
              >
                <option value={25}>25 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </Select>
            </Field>
            <Field label="Daily study limit">
              <Select
                value={maxDailyStudyMinutes}
                onChange={(event) => setMaxDailyStudyMinutes(Number(event.target.value))}
              >
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={300}>5 hours</option>
              </Select>
            </Field>
          </div>
          <Field label="Burnout sensitivity">
            <Select
              value={burnoutSensitivity}
              onChange={(event) =>
                setBurnoutSensitivity(event.target.value as BurnoutSensitivity)
              }
            >
              <option value="low">Low - push me harder</option>
              <option value="medium">Medium - balance focus and recovery</option>
              <option value="high">High - warn me early</option>
            </Select>
          </Field>
          <Button disabled={submitting} type="submit">
            {submitting ? "Saving..." : "Create my study plan"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
