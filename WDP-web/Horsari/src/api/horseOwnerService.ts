import api from './axios';

export interface Owner {
  _id: string;
  address: string;
  licenseStatus: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Horse {
  _id: string;
  horseName: string;
  breed: string;
  gender: 'male' | 'female'; // Extrapolated based on standard data
  dateOfBirth: string;
  healthStatus: 'healthy' | string; // Can be string or a specific union type if you have more statuses
  status: 'active' | string;
  ownerId: Owner; // Nested owner object
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface hireJockey {
  horseId: string,
  jockeyId: string,
  registrationId: string,
  percentagePayout: number,
  isBackup: boolean,
  isJockeyInRace?: boolean,
}

export const horseOwnerService = {
  getUserHorse: async (
    page = 1,
    limit = 10,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (search) params.search = search;
      const response = await api.get('/horseowner/my-horses', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getHorseOwnerInvitations: async (
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      if (status) params.status = status;
      if (search) params.search = search;
      const response = await api.get('/horseowner/race-invitations', { params });
      console.log('DATA: ', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getAllJockey: async (
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) => {
    try {
      const params: any = { page, limit, sortBy, order };
      const response = await api.get('/jockey/all', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  approveRegistration: async (registrationId: string) => {
    if (!registrationId || registrationId === '') return
    try {
      await api.post(`/horseowner/registration/${registrationId}/approve`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  HireJockey: async (data: hireJockey) => {
    if (!data) return;
    try {
      await api.post(`/invitations`, data);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  allJockeyInvitations: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/horseowner/invitations', { params: { page, limit } });
      console.log('allJockeyInvitations: ', response.data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};
