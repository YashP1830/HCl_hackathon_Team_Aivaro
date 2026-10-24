import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { ApiErrorBody } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Attach JWT token from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default client;

/** Extract a human-readable error message from an Axios error */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (error.response?.status === 403) return 'You do not have permission to access this resource.';
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (error.response && error.response.status >= 500) return 'A server error occurred. Please try again later.';
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
