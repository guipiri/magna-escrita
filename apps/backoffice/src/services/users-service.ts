import { api } from './api';
import { CreateUserRequest, UpdateUserRequest, UserListResponse } from '@repo/shared';

export const getUsers = async (): Promise<UserListResponse[]> => {
  const response = await api.get<UserListResponse[]>('/users');
  return response.data;
};

export const createUser = async (
  data: CreateUserRequest,
): Promise<UserListResponse> => {
  const response = await api.post<UserListResponse>('/users', data);
  return response.data;
};

export const updateUser = async (
  id: string,
  data: UpdateUserRequest,
): Promise<UserListResponse> => {
  const response = await api.put<UserListResponse>(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
