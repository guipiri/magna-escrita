import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  CreateEventRequest,
  EventResponse,
  SchoolYear,
  UserRole,
} from '@repo/shared';
import {
  AuthographsEventStatus,
  Prisma,
  SchoolYear as PrismaSchoolYear,
} from '@prisma/client';
import { PrismaService } from '../db/db.service.js';
import {
  NotFoundUnitException,
  UnauthorizedUserIsNotAdminException,
  UnauthorizedUserNoAccessToUnitException,
} from '../schools/schools.errors.js';
import { ConflictEventAlreadyActiveException, BadRequestTimelineOrderException, BadRequestTimelinePastException } from './events.errors.js';

const TIMELINE_ORDER = [
  'Início do período para realização da atividade em sala de aula',
  'Prazo final para realização da atividade em sala de aula',
  'Início do período para upload das folhas e revisão da escola na plataforma',
  'Prazo final para upload das folhas e revisão da escola na plataforma',
  'Início da revisão da Magna',
  'Prazo para Magna finalizar revisão dos livros na plataforma',
  'Início das vendas',
  'Fim das vendas',
  'Início da produção',
  'Fim da produção',
  'Dia do autógrafo na escola',
];

const DEFAULT_TIMELINE_TEMPLATES = [
  { details: 'Início do período para realização da atividade em sala de aula', offsetDays: 70 },
  { details: 'Prazo final para realização da atividade em sala de aula', offsetDays: 56 },
  { details: 'Início do período para upload das folhas e revisão da escola na plataforma', offsetDays: 56 },
  { details: 'Prazo final para upload das folhas e revisão da escola na plataforma', offsetDays: 42 },
  { details: 'Início da revisão da Magna', offsetDays: 42 },
  { details: 'Prazo para Magna finalizar revisão dos livros na plataforma', offsetDays: 28 },
  { details: 'Início das vendas', offsetDays: 28 },
  { details: 'Fim das vendas', offsetDays: 14 },
  { details: 'Início da produção', offsetDays: 14 },
  { details: 'Fim da produção', offsetDays: 1 },
  { details: 'Dia do autógrafo na escola', offsetDays: 0 },
];

function subtractDays(date: Date, days: number): Date {
  const newDate = new Date(date.getTime());
  newDate.setDate(newDate.getDate() - days);
  return newDate;
}

const eventInclude = {
  unit: {
    select: {
      id: true,
      name: true,
      school: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  timeline: true,
} as const;

type EventRecord = Prisma.AuthographsEventGetPayload<{
  include: typeof eventInclude;
}>;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser): Promise<EventResponse[]> {
    const events = await this.prisma.authographsEvent.findMany({
      where:
        user.role === UserRole.ADMIN
          ? undefined
          : {
              unit: {
                userUnits: {
                  some: { userId: user.id },
                },
              },
            },
      include: eventInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return events.map((event) => this.serializeEvent(event));
  }

  async create(
    body: CreateEventRequest,
    user: AuthUser,
  ): Promise<EventResponse> {
    if (user.role !== UserRole.ADMIN)
      throw new UnauthorizedUserIsNotAdminException();

    const unit = await this.prisma.unit.findUnique({
      where: { id: body.unitId },
      select: {
        id: true,
        name: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!unit) throw new NotFoundUnitException();

    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: {
          userId: user.id,
          unitId: body.unitId,
        },
        select: { id: true },
      });

      if (!access) throw new UnauthorizedUserNoAccessToUnitException();
    }

    const activeEvent = await this.prisma.authographsEvent.findFirst({
      where: {
        unitId: body.unitId,
        status: {
          in: [AuthographsEventStatus.PLANNED, AuthographsEventStatus.ONGOING],
        },
      },
      select: { id: true },
    });

    if (activeEvent) throw new ConflictEventAlreadyActiveException(unit.name);

    const eventDate = new Date(body.date);
    let timelineData: Array<{ date: Date; details: string }> = [];

    if (body.useDefaultTimeline) {
      timelineData = DEFAULT_TIMELINE_TEMPLATES.map((tpl) => ({
        date: subtractDays(eventDate, tpl.offsetDays),
        details: tpl.details,
      }));
    } else {
      if (!body.timelineDates || body.timelineDates.length !== 11) {
        throw new BadRequestTimelineOrderException();
      }

      const dates = body.timelineDates.map((d) => new Date(d));
      for (let i = 0; i < dates.length - 1; i++) {
        const current = dates[i];
        const next = dates[i + 1];
        if (current && next && current.getTime() > next.getTime()) {
          throw new BadRequestTimelineOrderException();
        }
      }

      timelineData = DEFAULT_TIMELINE_TEMPLATES.map((tpl, index) => {
        const d = dates[index];
        if (!d) {
          throw new BadRequestTimelineOrderException();
        }
        return {
          date: d,
          details: tpl.details,
        };
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (timelineData[0] && timelineData[0].date.getTime() < today.getTime()) {
      throw new BadRequestTimelinePastException();
    }

    const event = await this.prisma.authographsEvent.create({
      data: {
        name: body.name,
        date: eventDate,
        schoolYear: body.schoolYear,
        unitId: body.unitId,
        timeline: {
          create: timelineData,
        },
      },
      include: eventInclude,
    });

    return this.serializeEvent(event);
  }

  private serializeEvent(event: EventRecord): EventResponse {
    const unit = event.unit;

    if (!unit) {
      throw new NotFoundUnitException();
    }

    const sortedTimeline = event.timeline
      ? [...event.timeline]
          .sort((a, b) => {
            const indexA = TIMELINE_ORDER.indexOf(a.details || '');
            const indexB = TIMELINE_ORDER.indexOf(b.details || '');
            return indexA - indexB;
          })
          .map((item) => ({
            id: item.id,
            date: item.date.toISOString(),
            details: item.details,
          }))
      : undefined;

    return {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      schoolYear: event.schoolYear as SchoolYear,
      status: event.status,
      unit: {
        id: unit.id,
        name: unit.name,
        schoolName: unit.school.name,
      },
      timeline: sortedTimeline,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}

