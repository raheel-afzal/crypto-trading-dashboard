import { type ReactNode, useId } from 'react';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, action, children }: PanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-white/8 bg-neutral-900 bg-linear-to-b from-white/4 to-transparent to-40% p-4 shadow-xl shadow-black/25 sm:p-5"
    >
      <header className="mb-4 flex min-h-8 flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <h2 id={headingId} className="text-sm font-semibold text-neutral-100">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
