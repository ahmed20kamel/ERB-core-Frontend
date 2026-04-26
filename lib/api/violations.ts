import apiClient from './client';
import { MunicipalViolation, PaginatedResponse } from '@/types';

export interface ViolationStats {
  total: number;
  new: number;
  notified: number;
  resolved: number;
  fined: number;
  no_project: number;
}

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

  getStats: async (): Promise<ViolationStats> => {
    const response = await apiClient.get('/violations/stats/');
    return response.data;
  },

  getById: async (id: number): Promise<MunicipalViolation> => {
    const response = await apiClient.get(`/violations/${id}/`);
    return response.data;
  },

  markResolved: async (id: number): Promise<void> => {
    await apiClient.post(`/violations/${id}/mark_resolved/`);
  },

  simulate: async (message: string): Promise<{
    status: 'ok' | 'ignored';
    reason?: string;
    violation_id?: number;
    project?: string | null;
    engineer?: string | null;
    reference?: string;
    parsed?: { sector?: string; plot?: string; deadline_days?: number | null; fine_amount?: string | null };
  }> => {
    const response = await apiClient.post('/violations/simulate/', { message });
    return response.data;
  },
};
