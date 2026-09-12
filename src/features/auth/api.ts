import { api } from '@/lib/api/client';
import type { AuthResponse, LoginRequest, SignupRequest } from './schemas';

export async function login(request: LoginRequest): Promise<AuthResponse> {
  return (await api.post<AuthResponse>('/auth/login', request)).data;
}

export async function signup(request: SignupRequest): Promise<AuthResponse> {
  return (await api.post<AuthResponse>('/auth/signup', request)).data;
}
