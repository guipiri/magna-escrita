import type { OrderResponse } from 'mercadopago/dist/clients/order/commonTypes';

export interface CreateOrderRes {
  order: {
    id: string;
  };
  mpOrder: OrderResponse;
}

export interface OrderItem {
  bookId: string;
  quantity: number;
  description?: string;
}

export interface CreateOrderReq {
  items: OrderItem[];
  email: string;
  token?: string;
  identificationType?: string;
  identificationNumber?: string;
  installments: number;
  paymentMethod: string;
  paymentMethodDetail?: string;
  issuerId?: string;
}

export * from 'mercadopago/dist/clients/order/commonTypes.js';
