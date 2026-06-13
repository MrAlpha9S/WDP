import axios from 'axios';
import { clearSession, getSession } from '../auth/storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Module-level callback invoked on any 401 response.
// Registered by AuthContext so navigation happens inside React tree.
let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

// Attach Bearer token to every request that goes through this client.
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// On 401: clear stored session and trigger logout via the registered handler.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearSession();
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
