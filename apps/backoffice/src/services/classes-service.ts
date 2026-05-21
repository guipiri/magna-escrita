import { api } from './api';
import {
  GetClassesResponse,
  CreateClassRequest,
  CreateClassResponse,
  UpdateClassRequest,
  UpdateClassStudentItem,
  ClassStudentResponse,
  UpdateClassStudentsRequest,
} from '@repo/shared';

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

export const downloadClassPdf = async (classId: string): Promise<void> => {
  const response = await api.get<Blob>(`/pdf/class/${classId}`, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'autografos.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
