import type { Metadata } from 'next';
import { SignupScreen } from '@/features/auth/SignupScreen';

export const metadata: Metadata = {
  title: 'Create account · Crypto Trading Dashboard',
};

export default function Page() {
  return <SignupScreen />;
}
