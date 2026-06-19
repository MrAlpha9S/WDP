import api from "./axios";

export const authService = {
    login: async (data: any) => {
        try {
            const response = await api.post("/auth/login", data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                return "Login credentials are incorrect. Please try again.";
            } else {
                return "An error occurred. Please try again later.";
            }
        }
    },
    register: async (data: FormData) => {

        const response = await api.post("/auth/register", data, {
            transformRequest: [(d, headers) => {
                delete headers['Content-Type'];
                return d;
            }],
        });
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get("/auth/current-user");
        return response.data;
    },
    logout: async () => {
        const response = await api.post("/auth/logout");
        return response.data;
    }
};
