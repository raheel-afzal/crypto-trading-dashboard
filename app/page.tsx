import { cookies } from 'next/headers';
import { readUser, SESSION_COOKIE } from '@/features/auth/session';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';

export default async function Page() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  return <DashboardScreen user={token ? readUser(token) : null} />;
}
