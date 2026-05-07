import { api } from './api';
import {
  GetSchoolsResponse,
  CreateGradeRequest,
  CreateGradeResponse,
} from '@repo/shared';

export const getSchoolUnits = async (): Promise<GetSchoolsResponse[]> => {
  const response = await api.get<GetSchoolsResponse[]>('/units');
  return response.data;
};

export const createGrade = async (
  data: CreateGradeRequest,
): Promise<CreateGradeResponse> => {
  const response = await api.post<CreateGradeResponse>('/grades', data);
  return response.data;
};
