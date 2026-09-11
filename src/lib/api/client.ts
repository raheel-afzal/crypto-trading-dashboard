import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws`;

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 10_000 });
