import { CreateOrderReq, CreateOrderRes, GetOrderRes } from '@repo/shared';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const createOrder = async (
  data: CreateOrderReq,
): Promise<CreateOrderRes> => {
  try {
    const response = await axios.post(`${API_URL}/order`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar Order de pagamento:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<GetOrderRes> => {
  try {
    const response = await axios.get(`${API_URL}/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar Order:', error);
    throw error;
  }
};
