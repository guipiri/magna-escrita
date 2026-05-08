import { api } from './api';
import {
  GetClassesResponse,
  GetSchoolsResponse,
  CreateClassRequest,
  CreateClassResponse,
} from '@repo/shared';

export const getSchoolUnits = async (): Promise<GetSchoolsResponse[]> => {
  const response = await api.get<GetSchoolsResponse[]>('/units');
  return response.data;
};

export const getClasses = async (): Promise<GetClassesResponse[]> => {
  const response = await api.get<GetClassesResponse[]>('/grades');
  return response.data;
};

export const createClass = async (
  data: CreateClassRequest,
): Promise<CreateClassResponse> => {
  const response = await api.post<CreateClassResponse>('/grades', data);
  return response.data;
};
