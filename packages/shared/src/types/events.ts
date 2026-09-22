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
  hasBooks?: boolean;
}

export interface CreateEventRequest {
  name: string;
  date: string;
  schoolYear: SchoolYear;
  unitId: string;
  useDefaultTimeline: boolean;
  timelineDates?: string[];
}

export interface UpdateEventRequest {
  name?: string;
  date?: string;
  schoolYear?: SchoolYear;
  unitId?: string;
  useDefaultTimeline?: boolean;
  timelineDates?: string[];
  status?: EventStatus;
}

export enum EventTimelineStageId {
  CLASSROOM_ACTIVITY_START = 'CLASSROOM_ACTIVITY_START',
  SCHOOL_UPLOAD_START = 'SCHOOL_UPLOAD_START',
  MAGNA_REVISION_START = 'MAGNA_REVISION_START',
  SALES_START = 'SALES_START',
  PRODUCTION_START = 'PRODUCTION_START',
  AUTOGRAPHS_DAY = 'AUTOGRAPHS_DAY',
}

export interface EventTimelineTemplate {
  id: EventTimelineStageId;
  details: string;
  offsetDays: number;
}

export const DEFAULT_TIMELINE_TEMPLATES: readonly EventTimelineTemplate[] = [
  {
    id: EventTimelineStageId.CLASSROOM_ACTIVITY_START,
    details: 'Início do período para realização da atividade em sala de aula',
    offsetDays: 70,
  },
  {
    id: EventTimelineStageId.SCHOOL_UPLOAD_START,
    details:
      'Início do período para upload das folhas e revisão da escola na plataforma',
    offsetDays: 56,
  },
  {
    id: EventTimelineStageId.MAGNA_REVISION_START,
    details: 'Início da revisão da Magna',
    offsetDays: 42,
  },
  {
    id: EventTimelineStageId.SALES_START,
    details: 'Início das vendas',
    offsetDays: 28,
  },
  {
    id: EventTimelineStageId.PRODUCTION_START,
    details: 'Início da produção',
    offsetDays: 14,
  },
  {
    id: EventTimelineStageId.AUTOGRAPHS_DAY,
    details: 'Dia do autógrafo na escola',
    offsetDays: 0,
  },
] as const;

export const TIMELINE_ORDER: readonly string[] = DEFAULT_TIMELINE_TEMPLATES.map(
  (tpl) => tpl.details,
);

export const DEFAULT_TIMELINE_OFFSETS: readonly number[] =
  DEFAULT_TIMELINE_TEMPLATES.map((tpl) => tpl.offsetDays);

export function calculateTimelineDate(
  baseDateStr: string,
  offsetDays: number,
): string {
  const baseDate = new Date(`${baseDateStr.slice(0, 10)}T12:00:00`);
  const calcDate = new Date(baseDate.getTime());
  calcDate.setDate(calcDate.getDate() - offsetDays);

  const year = calcDate.getFullYear();
  const month = String(calcDate.getMonth() + 1).padStart(2, '0');
  const day = String(calcDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}




