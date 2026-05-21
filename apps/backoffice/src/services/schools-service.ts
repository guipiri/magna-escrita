import { api } from './api';
import {
  GetSchoolsResponse,
  GetSchoolsListResponse,
  CreateSchoolRequest,
  SchoolYearOption,
} from '@repo/shared';

export const getSchoolsList = async (): Promise<GetSchoolsListResponse[]> => {
  const response = await api.get<GetSchoolsListResponse[]>('/schools');
  return response.data;
};

export const getSchoolUnits = async (): Promise<GetSchoolsResponse[]> => {
  const response = await api.get<GetSchoolsResponse[]>('/units');
  return response.data;
};

export const getSchoolYears = async (): Promise<SchoolYearOption[]> => {
  const response = await api.get<SchoolYearOption[]>('/school-years');
  return response.data;
};

export const createSchool = async (
  data: CreateSchoolRequest,
): Promise<{ id: string; name: string }> => {
  const response = await api.post<{ id: string; name: string }>(
    '/schools',
    data,
  );
  return response.data;
};
