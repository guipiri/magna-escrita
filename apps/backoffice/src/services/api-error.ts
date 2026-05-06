import { ApiError } from '@repo/shared';
import axios, { AxiosError } from 'axios';

export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = (error as AxiosError<ApiError>).response?.data;
    if (data) return data;
  }

  return {
    statusCode: 0,
    code: 'UNKNOWN_ERROR',
    message: 'Erro inesperado',
    timestamp: new Date().toISOString(),
    path: 'UNKNOWN_PATH',
  };
};
