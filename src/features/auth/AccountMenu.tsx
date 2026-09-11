'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { AuthUser } from './schemas';
import { clearToken } from './session';

export function AccountMenu({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  function signOut() {
    clearToken();
    // The next account must not inherit this one's cached portfolio and orders.
    queryClient.clear();
    router.replace('/login');
  }

  return (
    <>
      {user && <span className="hidden text-xs text-neutral-400 sm:block">{user.name}</span>}
      <Button onClick={signOut}>Sign out</Button>
    </>
  );
}
