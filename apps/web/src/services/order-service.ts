import {
  CreateOrderReq,
  CreateOrderRes,
  GetOrderRes,
  GetOrdersRes,
} from '@repo/shared';
import { api } from './api';

export const createOrder = async (
  data: CreateOrderReq,
): Promise<CreateOrderRes> => {
  const response = await api.post('/order', data);
  return response.data;
};

export const getOrder = async (orderId: string): Promise<GetOrderRes> => {
  const response = await api.get(`/order/${orderId}`);
  return response.data;
};

export const getOrders = async (): Promise<GetOrdersRes> => {
  const response = await api.get('/order');
  return response.data;
};
