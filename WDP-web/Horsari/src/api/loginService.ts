import api from "./axios";
import type { AvatarUploadResponse } from "./profileTypes";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: string;
    fullName: string;
    image?: string | null;
}

export interface AuthResponse {
    code: number;
    data: {
        accessToken: string;
        user: AuthUser;
    };
    msg: string;
}

export interface CurrentUserResponse {
    code: number;
    data: {
        id: string;
        username: string;
        email: string;
        fullName: string;
        phoneNumber: string;
        role: string;
        status: string;
        image?: string | null;
    };
    msg: string;
}

export interface LogoutResponse {
    msg: string;
}

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse | string> => {
        try {
            const response = await api.post<AuthResponse>("/auth/login", data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                return "Login credentials are incorrect. Please try again.";
            } else {
                return "An error occurred. Please try again later.";
            }
        }
    },
    register: async (data: FormData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>("/auth/register", data, {
            transformRequest: [(d, headers) => {
                delete headers['Content-Type'];
                return d;
            }],
        });
        return response.data;
    },
    getCurrentUser: async (): Promise<CurrentUserResponse> => {
        const response = await api.get<CurrentUserResponse>("/auth/current-user");
        return response.data;
    },
    // Role-agnostic — every role shares the same User.image avatar field.
    uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
        const form = new FormData();
        form.append("image", file);
        const response = await api.post<AvatarUploadResponse>("/auth/avatar", form, {
            transformRequest: [(d, headers) => {
                delete headers['Content-Type'];
                return d;
            }],
        });
        return response.data;
    },
    logout: async (): Promise<LogoutResponse> => {
        const response = await api.post<LogoutResponse>("/auth/logout");
        return response.data;
    }
};
