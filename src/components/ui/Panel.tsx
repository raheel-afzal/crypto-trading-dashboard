import { type ReactNode, useId } from 'react';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, action, children }: PanelProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
      <header className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-sm font-semibold text-neutral-100">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
