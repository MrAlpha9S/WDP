import apiClient from '../api/axios';
import type { UserSession } from './storage';

export interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponseData {
  accessToken: string;
  user: {
    username: string;
    email: string;
    role: string;
    fullName: string;
  };
}

export type LoginResult =
  | { ok: true; session: UserSession }
  | { ok: false; message: string };

export async function loginUser(
  payload: LoginPayload
): Promise<LoginResult> {
  try {
    const res = await apiClient.post<{
      code: number;
      data?: LoginResponseData;
      msg: string;
    }>('/api/auth/login', payload);

    const { code, data, msg } = res.data;

    if (code === 200 && data?.accessToken && data?.user) {
      return {
        ok: true,
        session: {
          accessToken: data.accessToken,
          user: {
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
            fullName: data.user.fullName,
          },
        },
      };
    }

    return { ok: false, message: msg ?? 'Đăng nhập thất bại' };
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg ??
      'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    return { ok: false, message: msg };
  }
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role: 'spectator' | 'jockey';
  /** Required PDF license for jockey (and other licensed roles). */
  license?: { uri: string; name: string; mimeType: string };
}

export async function registerUser(
  payload: RegisterPayload
): Promise<LoginResult> {
  try {
    const form = new FormData();
    form.append('username', payload.username);
    form.append('email', payload.email);
    form.append('password', payload.password);
    form.append('fullName', payload.fullName);
    if (payload.phoneNumber) form.append('phoneNumber', payload.phoneNumber);
    form.append('role', payload.role);
    if (payload.license) {
      form.append('license', {
        uri: payload.license.uri,
        name: payload.license.name,
        type: payload.license.mimeType,
      } as any);
    }

    const res = await apiClient.post<{
      code: number;
      data?: LoginResponseData;
      msg: string;
    }>('/api/auth/register', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const { code, data, msg } = res.data;

    if (code === 201 && data?.accessToken && data?.user) {
      return {
        ok: true,
        session: {
          accessToken: data.accessToken,
          user: {
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
            fullName: data.user.fullName,
          },
        },
      };
    }

    return { ok: false, message: msg ?? 'Đăng ký thất bại' };
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg ??
      'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    return { ok: false, message: msg };
  }
}
