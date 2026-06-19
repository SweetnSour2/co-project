import { FormEvent, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Field, Input, Select } from "../components/ui/Field";
import { useAuth } from "../features/auth/AuthContext";
import type { BurnoutSensitivity } from "../types";

export function SettingsPage() {
  const { profile, preferences, completeOnboarding } = useAuth();
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
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await completeOnboarding({
      displayName: displayName || "Student",
      preferredStudyStartHour,
      preferredStudyEndHour,
      preferredSessionMinutes,
      maxDailyStudyMinutes,
      burnoutSensitivity,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        Settings
      </p>
      <h1 className="text-3xl font-black text-slate-950">Study preferences</h1>

      <Card className="mt-6">
        <CardTitle title="Planning defaults" eyebrow="Personalization" />
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Field label="Display name">
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Study start hour">
              <Input
                type="number"
                min={5}
                max={23}
                value={preferredStudyStartHour}
                onChange={(event) => setStartHour(Number(event.target.value))}
              />
            </Field>
            <Field label="Study end hour">
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
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit">Save preferences</Button>
            {saved ? <p className="text-sm font-medium text-emerald-600">Saved</p> : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
