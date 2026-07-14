import { api } from './api';
import { GetPricesResponse } from '@repo/shared';

export const getPrices = async (): Promise<GetPricesResponse[]> => {
  const response = await api.get<GetPricesResponse[]>('/prices');
  return response.data;
};
