import type { SchoolYear } from './schools';

export type EventStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELED';

export interface EventUnitSummary {
  id: string;
  name: string | null;
  schoolName: string;
}

export interface EventResponse {
  id: string;
  name: string;
  date: string;
  schoolYear: SchoolYear;
  status: EventStatus;
  unit: EventUnitSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  name: string;
  date: string;
  schoolYear: SchoolYear;
  unitId: string;
}
