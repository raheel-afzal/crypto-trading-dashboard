interface LoadingStateProps {
  label: string;
  rows?: number;
}

export function LoadingState({ label, rows = 3 }: LoadingStateProps) {
  return (
    <div role="status" className="space-y-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} aria-hidden="true" className="h-10 animate-pulse rounded-md bg-white/5" />
      ))}
    </div>
  );
}
