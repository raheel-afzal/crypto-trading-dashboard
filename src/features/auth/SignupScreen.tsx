'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getErrorMessage } from '@/lib/api/errors';
import { signup } from './api';
import { saveToken } from './session';

const FIELD =
  'mt-1 block w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-neutral-100 focus-visible:outline-2 focus-visible:outline-sky-400';

export function SignupScreen() {
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const createAccount = useMutation({
    mutationFn: signup,
    onSuccess: ({ accessToken }) => {
      saveToken(accessToken);
      router.replace('/');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createAccount.mutate({ name, email, password });
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
          <p className="text-xs text-neutral-500">Open an account with $100,000 to trade</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/8 bg-neutral-900 bg-linear-to-b from-white/4 to-transparent to-40% p-5 shadow-xl shadow-black/25"
      >
        <label htmlFor={nameId} className="text-sm text-neutral-400">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={FIELD}
        />

        <label htmlFor={emailId} className="mt-4 block text-sm text-neutral-400">
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={FIELD}
        />
        <p className="mt-1.5 text-xs text-neutral-500">At least 8 characters.</p>

        <Button type="submit" variant="buy" size="md" disabled={createAccount.isPending} className="mt-5 w-full">
          {createAccount.isPending ? 'Creating account…' : 'Create account'}
        </Button>

        {createAccount.isError && (
          <div className="mt-4">
            <ErrorMessage title="Sign up failed" message={getErrorMessage(createAccount.error)} />
          </div>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-neutral-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-sky-400 hover:text-sky-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
