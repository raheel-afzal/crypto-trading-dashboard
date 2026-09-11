'use client';

import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl p-6">
      <ErrorMessage title="Something went wrong" message={error.message} onRetry={retry} />
    </div>
  );
}
