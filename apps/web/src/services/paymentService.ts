import axios from 'axios';
import type { OrderResponse } from '@repo/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface OrderCreatePayload {
  price: number;
  quantity: number;
  email?: string;
  token?: string;
  installments?: number;
  payment_method_id: string;
  issuer_id?: number;
  description?: string;
}

export const createOrder = async (
  data: OrderCreatePayload,
): Promise<OrderResponse> => {
  try {
    const response = await axios.post(`${API_URL}/payment/create-order`, data);
    return response.data?.order;
  } catch (error) {
    console.error('Erro ao criar Order de pagamento:', error);
    throw error;
  }
};
