import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-soft ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
