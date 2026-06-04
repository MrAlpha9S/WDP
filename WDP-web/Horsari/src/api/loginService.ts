import api from "./axios";

export const authService = {
  login: async (data: any) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
  register: async (data: any) => {
    // If data is FormData, axios handles the headers automatically
    const response = await api.post("/auth/register", data);
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
