import { api } from './api';
import type {
  CreateEventRequest,
  UpdateEventRequest,
  EventResponse,
  FulfillmentStatusEnum,
  GetEventBookProductionResponse,
  UpdateFulfillmentResponse,
} from '@repo/shared';

export const getEvents = async (): Promise<EventResponse[]> => {
  const response = await api.get<EventResponse[]>('/events');
  return response.data;
};

export const createEvent = async (
  data: CreateEventRequest,
): Promise<EventResponse> => {
  const response = await api.post<EventResponse>('/events', data);
  return response.data;
};

export const updateEvent = async (
  id: string,
  data: UpdateEventRequest,
): Promise<EventResponse> => {
  const response = await api.put<EventResponse>(`/events/${id}`, data);
  return response.data;
};

export const getEventById = async (id: string): Promise<EventResponse> => {
  const response = await api.get<EventResponse>(`/events/${id}`);
  return response.data;
};

export const getEventBookProduction = async (
  eventId: string,
): Promise<GetEventBookProductionResponse> => {
  const response = await api.get<GetEventBookProductionResponse>(
    `/events/${eventId}/production`,
  );
  return response.data;
};

export const updateEventBookFulfillment = async (
  eventId: string,
  bookId: string,
  status: FulfillmentStatusEnum,
): Promise<UpdateFulfillmentResponse> => {
  const response = await api.patch<UpdateFulfillmentResponse>(
    `/events/${eventId}/production/books/${bookId}/status`,
    { fulfillmentStatus: status },
  );
  return response.data;
};

export const updateEventOrderItemFulfillment = async (
  eventId: string,
  orderId: string,
  bookId: string,
  status: FulfillmentStatusEnum,
): Promise<UpdateFulfillmentResponse> => {
  const response = await api.patch<UpdateFulfillmentResponse>(
    `/events/${eventId}/production/items/${orderId}/${bookId}/status`,
    { fulfillmentStatus: status },
  );
  return response.data;
};
