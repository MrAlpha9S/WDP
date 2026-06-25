import axios from 'axios';
import { clearSession, getSession } from '../auth/storage';
import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === "android"
    ? process.env.EXPO_PUBLIC_API_URL_ANDROID
    : process.env.EXPO_PUBLIC_API_URL_WEB;

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

// On 401 or 403: clear stored session and trigger logout via the registered handler.
// 401 = token missing/expired; 403 = token present but defective/tampered.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      await clearSession();
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
