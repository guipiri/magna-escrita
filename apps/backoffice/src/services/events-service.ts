import { api } from './api';
import type { CreateEventRequest, EventResponse } from '@repo/shared';

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
