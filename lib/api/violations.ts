import apiClient from './client';
import { MunicipalViolation, PaginatedResponse } from '@/types';

export const violationsApi = {
  getAll: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    project?: number;
    notified_engineer?: number;
  }): Promise<PaginatedResponse<MunicipalViolation>> => {
    const response = await apiClient.get('/violations/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<MunicipalViolation> => {
    const response = await apiClient.get(`/violations/${id}/`);
    return response.data;
  },

  markResolved: async (id: number): Promise<void> => {
    await apiClient.post(`/violations/${id}/mark_resolved/`);
  },
};
