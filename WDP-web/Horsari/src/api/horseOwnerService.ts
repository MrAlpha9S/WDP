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

export const horseOwnerService = {
  getUserHorse: async () => {
    try {
      const response = await api.get('/horse?limit=10&skip=0');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getHorseOwnerInvitations: async () => {
    try {
      const response = await api.get('/horseowner/race-invitations');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
  getAllJockey: async () => {
    try {
      const response = await api.get('/jockey/all?limit=10&skip=0');
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
};
