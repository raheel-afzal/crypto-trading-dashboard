'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getErrorMessage } from '@/lib/api/errors';
import { login } from './api';
import { saveToken } from './session';

const FIELD =
  'mt-1 block w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-neutral-100 focus-visible:outline-2 focus-visible:outline-sky-400';

export function LoginScreen() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('demo@trading.dev');
  const [password, setPassword] = useState('demo1234');

  const signIn = useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken }) => {
      saveToken(accessToken);
      router.replace('/');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signIn.mutate({ email, password });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-emerald-400 to-sky-500 text-neutral-950 shadow-lg shadow-emerald-500/20"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 16.5 9 10l4 4 8-8.5" />
            <path d="M15 5.5h6v6" />
          </svg>
        </span>
        <div>
          <h1 className="text-lg font-semibold text-neutral-50">Crypto Trading Dashboard</h1>
          <p className="text-xs text-neutral-500">Sign in to reach your portfolio</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/8 bg-neutral-900 bg-linear-to-b from-white/4 to-transparent to-40% p-5 shadow-xl shadow-black/25"
      >
        <label htmlFor={emailId} className="text-sm text-neutral-400">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={FIELD}
        />

        <label htmlFor={passwordId} className="mt-4 block text-sm text-neutral-400">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={FIELD}
        />

        <Button type="submit" variant="buy" size="md" disabled={signIn.isPending} className="mt-5 w-full">
          {signIn.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        {signIn.isError && (
          <div className="mt-4">
            <ErrorMessage title="Sign in failed" message={getErrorMessage(signIn.error)} />
          </div>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Demo accounts: demo@trading.dev / demo1234 · alex@trading.dev / alex1234
      </p>
    </div>
  );
}
