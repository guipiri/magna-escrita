import { api } from './api';
import { GetPricesResponse, CreatePriceRequest, CreatePriceResponse, UpdatePriceRequest } from '@repo/shared';

export const getPrices = async (): Promise<GetPricesResponse[]> => {
  const response = await api.get<GetPricesResponse[]>('/prices');
  return response.data;
};

export const createPrice = async (
  data: CreatePriceRequest,
): Promise<CreatePriceResponse> => {
  const response = await api.post<CreatePriceResponse>('/prices', data);
  return response.data;
};

export const updatePrice = async (
  id: string,
  data: UpdatePriceRequest,
): Promise<CreatePriceResponse> => {
  const response = await api.patch<CreatePriceResponse>(`/prices/${id}`, data);
  return response.data;
};
