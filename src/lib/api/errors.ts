import { isAxiosError } from 'axios';

interface ApiErrorBody {
  statusCode: number;
  message: string;
  error?: string;
  errorCode?: string;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (!error.response) return 'Cannot reach the trading server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
