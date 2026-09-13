import { api } from './api';
import type {
  GetBackofficeOrdersResponse,
  DeliverOrderToFamilyResponse,
  RevertOrderFamilyDeliveryResponse,
} from '@repo/shared';

export const getBackofficeOrders = async (): Promise<GetBackofficeOrdersResponse> => {
  const response = await api.get<GetBackofficeOrdersResponse>('/order/backoffice');
  return response.data;
};

export const deliverOrderToFamily = async (
  orderId: string,
): Promise<DeliverOrderToFamilyResponse> => {
  const response = await api.patch<DeliverOrderToFamilyResponse>(
    `/order/backoffice/${orderId}/deliver`,
  );
  return response.data;
};

export const revertOrderFamilyDelivery = async (
  orderId: string,
): Promise<RevertOrderFamilyDeliveryResponse> => {
  const response = await api.patch<RevertOrderFamilyDeliveryResponse>(
    `/order/backoffice/${orderId}/revert-delivery`,
  );
  return response.data;
};

