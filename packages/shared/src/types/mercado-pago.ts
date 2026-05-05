import type { OrderResponse } from 'mercadopago/dist/clients/order/commonTypes';

export interface CreateOrderRes {
  order: {
    id: string;
  };
  mpOrder: OrderResponse;
}

export interface OrderBook {
  id: string;
  title: string;
  author: string;
}

export interface OrderSummaryItem {
  bookId: string;
  quantity: number;
  amount: string | number;
  book: OrderBook;
}

export interface OrderSummary {
  id: string;
  status: string;
  totalAmount: string | number;
  items: OrderSummaryItem[];
}

export interface GetOrderRes {
  order?: OrderSummary;
  mpOrder?: OrderResponse;
  message?: string;
}

export interface GetOrdersRes {
  orders: OrderSummary[];
  message?: string;
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
