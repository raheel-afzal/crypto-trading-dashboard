import { Button } from './Button';

interface ErrorMessageProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title, message, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 size-4 shrink-0 text-rose-400">
        <circle cx="10" cy="10" r="7.25" />
        <path d="M10 6.5v4.25M10 13.5h.01" strokeLinecap="round" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-rose-100">{title}</p>
        <p className="mt-0.5 break-words text-rose-200/90">{message}</p>
      </div>
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </div>
  );
}
