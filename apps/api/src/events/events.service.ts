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
import { ConflictEventAlreadyActiveException } from './events.errors.js';

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

    const event = await this.prisma.authographsEvent.create({
      data: {
        name: body.name,
        date: new Date(body.date),
        schoolYear: body.schoolYear as PrismaSchoolYear,
        unitId: body.unitId,
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

    return {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      schoolYear: event.schoolYear as SchoolYear,
      status: event.status as EventResponse['status'],
      unit: {
        id: unit.id,
        name: unit.name,
        schoolName: unit.school.name,
      },
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
