import { api } from './api';
import {
  GetClassesResponse,
  GetSchoolsResponse,
  GetSchoolsListResponse,
  CreateClassRequest,
  CreateClassResponse,
  CreateSchoolRequest,
  UpdateClassRequest,
  UpdateClassStudentItem,
  ClassStudentResponse,
  UpdateClassStudentsRequest,
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

export const getClasses = async (): Promise<GetClassesResponse[]> => {
  const response = await api.get<GetClassesResponse[]>('/classes');
  return response.data;
};

export const createClass = async (
  data: CreateClassRequest,
): Promise<CreateClassResponse> => {
  const response = await api.post<CreateClassResponse>('/classes', data);
  return response.data;
};

export const updateClass = async (
  id: string,
  data: UpdateClassRequest & { students?: UpdateClassStudentItem[] },
): Promise<{ id: string; name: string; teacherName: string }> => {
  const response = await api.patch<{
    id: string;
    name: string;
    teacherName: string;
  }>(`/classes/${id}`, data);
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

export const deleteClass = async (id: string): Promise<void> => {
  await api.delete(`/classes/${id}`);
};

export const getClassStudents = async (
  classId: string,
): Promise<ClassStudentResponse[]> => {
  const response = await api.get<ClassStudentResponse[]>(
    `/classes/${classId}/students`,
  );
  return response.data;
};

export const updateClassStudents = async (
  classId: string,
  data: UpdateClassStudentsRequest,
): Promise<ClassStudentResponse[]> => {
  const response = await api.put<ClassStudentResponse[]>(
    `/classes/${classId}/students`,
    data,
  );
  return response.data;
};
