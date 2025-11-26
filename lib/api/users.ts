import apiClient from './client';
import { User, PaginatedResponse } from '@/types';

export const usersApi = {
  getAll: async (params?: {
    page?: number;
    search?: string;
    // Text filters
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    // Choice filters
    role?: string;
    is_staff?: boolean;
    is_active?: boolean;
    // Date filters
    date_joined_after?: string;
    date_joined_before?: string;
    last_login_after?: string;
    last_login_before?: string;
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/auth/users/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/auth/users/${id}/`);
    return response.data;
  },

  create: async (data: Partial<User>): Promise<User> => {
    // Check if avatar is a File object (for upload)
    const formData = new FormData();
    let hasFile = false;
    
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (key === 'avatar' && value instanceof File) {
        formData.append('avatar', value);
        hasFile = true;
      } else if (key !== 'avatar' && value !== undefined && value !== null) {
        // Handle boolean values
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    // If there's a file, use FormData, otherwise use JSON
    if (hasFile) {
      const response = await apiClient.post('/auth/users/', formData);
      return response.data;
    } else {
      const response = await apiClient.post('/auth/users/', data);
      return response.data;
    }
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    // Check if avatar is a File object (for upload)
    const formData = new FormData();
    let hasFile = false;
    
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (key === 'avatar' && value instanceof File) {
        formData.append('avatar', value);
        hasFile = true;
        console.log('Adding avatar file to FormData:', value.name, value.size, value.type);
      } else if (key !== 'avatar' && value !== undefined && value !== null && value !== '') {
        // Handle boolean values
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value.toString());
        }
        if (key === 'password') {
          console.log('Password included in update request');
        }
      }
    });
    
    // If there's a file OR password, use FormData, otherwise use JSON
    if (hasFile || data.password) {
      console.log('Sending FormData', hasFile ? '(with avatar file)' : '(with password)');
      const response = await apiClient.patch(`/auth/users/${id}/`, formData);
      console.log('Update response:', response.data);
      return response.data;
    } else {
      console.log('Sending JSON data (no file, no password)');
      const response = await apiClient.patch(`/auth/users/${id}/`, data);
      return response.data;
    }
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    // Check if avatar is a File object (for upload)
    const formData = new FormData();
    let hasFile = false;
    
    Object.keys(data).forEach((key) => {
      const value = (data as any)[key];
      if (key === 'avatar' && value instanceof File) {
        formData.append('avatar', value);
        hasFile = true;
      } else if (key !== 'avatar' && value !== undefined && value !== null) {
        // Handle boolean values
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    // If there's a file, use FormData, otherwise use JSON
    if (hasFile) {
      const response = await apiClient.patch('/auth/me/', formData);
      return response.data;
    } else {
      const response = await apiClient.patch('/auth/me/', data);
      return response.data;
    }
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/auth/users/${id}/`);
  },

  getPending: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get('/auth/users/pending/');
      console.log('Pending users API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  },

  approve: async (id: number, permissionSetId?: number): Promise<User> => {
    const response = await apiClient.post(`/auth/users/${id}/approve/`, {
      permission_set_id: permissionSetId,
    });
    return response.data;
  },
};

