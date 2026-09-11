import axios, { isAxiosError } from 'axios';
import { clearToken, readToken } from '@/features/auth/session';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws`;

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 10_000 });

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A refused session cannot be retried in place, so drop it and let the login route take over.
api.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && window.location.pathname !== '/login') {
    clearToken();
    window.location.replace('/login');
  }
  return Promise.reject(error);
});
