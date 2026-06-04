import api from "./axios";

export const authService = {
  login: async (data: any) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
  register: async (data: FormData) => {
    // Send as multipart/form-data — let axios set the Content-Type with boundary automatically
    const response = await api.post("/auth/register", data, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
