import { api } from '@/lib/api/client';
import type { AuthResponse, LoginRequest } from './schemas';

export async function login(request: LoginRequest): Promise<AuthResponse> {
  return (await api.post<AuthResponse>('/auth/login', request)).data;
}
