import api from "./axios";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    username: string;
    email: string;
    role: string;
    fullName: string;
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
    logout: async (): Promise<LogoutResponse> => {
        const response = await api.post<LogoutResponse>("/auth/logout");
        return response.data;
    }
};
