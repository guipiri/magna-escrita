import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface PaymentData {
  title: string;
  quantity: number;
  price: number;
  description?: string;
  email?: string;
}

export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export const createPaymentPreference = async (
  data: PaymentData,
): Promise<PaymentPreference> => {
  try {
    const response = await axios.post<PaymentPreference>(
      `${API_URL}/payment/create-preference`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentId: string) => {
  try {
    const response = await axios.get(`${API_URL}/payment/status/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao obter status do pagamento:', error);
    throw error;
  }
};
