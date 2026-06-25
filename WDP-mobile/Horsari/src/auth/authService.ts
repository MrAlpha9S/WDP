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
