import { request } from './apiClient';

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  nationality: string | null;
  networks: string[] | null;
  role: 'admin' | 'user' | 'member';
  quoteCount: number;
  createdAt: string;
}

export interface UpdateUserParams {
  name?: string;
  company?: string;
  nationality?: string;
  role?: 'admin' | 'user' | 'member';
  networks?: string[];
}

export const listUsers = async (): Promise<AdminUser[]> => {
  return request<AdminUser[]>('/api/v1/users');
};

export const updateUser = async (id: number, params: UpdateUserParams): Promise<AdminUser> => {
  return request<AdminUser>(`/api/v1/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
};

export const deleteUser = async (id: number): Promise<void> => {
  return request<void>(`/api/v1/users/${id}`, { method: 'DELETE' });
};
