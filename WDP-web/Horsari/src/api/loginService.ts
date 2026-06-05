import api from "./axios";

export const authService = {
    login: async (data: any) => {
        const response = await api.post("/auth/login", data);
        return response.data;
    },
    register: async (data: FormData) => {
        // Delete the default Content-Type so axios/browser can set multipart/form-data
        // with the correct boundary automatically when given a FormData object
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
