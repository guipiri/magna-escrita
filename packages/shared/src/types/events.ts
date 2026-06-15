import type { SchoolYear } from './schools';

export type EventStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELED';

export interface EventUnitSummary {
  id: string;
  name: string | null;
  schoolName: string;
}

export interface EventTimelineResponse {
  id: string;
  date: string;
  details: string | null;
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
  timeline?: EventTimelineResponse[];
}

export interface CreateEventRequest {
  name: string;
  date: string;
  schoolYear: SchoolYear;
  unitId: string;
  useDefaultTimeline: boolean;
  timelineDates?: string[];
}

