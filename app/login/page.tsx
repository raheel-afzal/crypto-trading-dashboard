import type { Metadata } from 'next';
import { LoginScreen } from '@/features/auth/LoginScreen';

export const metadata: Metadata = {
  title: 'Sign in · Crypto Trading Dashboard',
};

export default function Page() {
  return <LoginScreen />;
}
