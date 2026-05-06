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
  try {
    const response = await api.post('/order', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar Order de pagamento:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<GetOrderRes> => {
  try {
    const response = await api.get(`/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar Order:', error);
    throw error;
  }
};

export const getOrders = async (): Promise<GetOrdersRes> => {
  try {
    const response = await api.get('/order');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar Orders:', error);
    throw error;
  }
};
