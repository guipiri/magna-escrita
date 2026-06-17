import { api } from './api';
import { CreateUserRequest, UserListResponse } from '@repo/shared';

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
