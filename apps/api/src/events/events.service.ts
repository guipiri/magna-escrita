import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  CreateEventRequest,
  UpdateEventRequest,
  EventResponse,
  SchoolYear,
  UserRole,
  FulfillmentStatusEnum,
  type GetEventBookProductionResponse,
  type UpdateFulfillmentResponse,
} from '@repo/shared';
import {
  AuthographsEventStatus,
  FulfillmentStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../db/db.service.js';
import {
  NotFoundUnitException,
  UnauthorizedUserIsNotAdminException,
  UnauthorizedUserNoAccessToUnitException,
} from '../schools/schools.errors.js';
import {
  ConflictEventAlreadyActiveException,
  BadRequestTimelineOrderException,
  BadRequestTimelinePastException,
  NotFoundEventException,
  ConflictEventWithExistingBooksException,
} from './events.errors.js';
import { NotFoundOrderItemException } from '../orders/orders.errors.js';
import { NotFoundBookException } from '../books/books.errors.js';

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
  {
    details: 'Início do período para realização da atividade em sala de aula',
    offsetDays: 70,
  },
  {
    details: 'Prazo final para realização da atividade em sala de aula',
    offsetDays: 56,
  },
  {
    details:
      'Início do período para upload das folhas e revisão da escola na plataforma',
    offsetDays: 56,
  },
  {
    details:
      'Prazo final para upload das folhas e revisão da escola na plataforma',
    offsetDays: 42,
  },
  { details: 'Início da revisão da Magna', offsetDays: 42 },
  {
    details: 'Prazo para Magna finalizar revisão dos livros na plataforma',
    offsetDays: 28,
  },
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
  _count: {
    select: {
      books: true,
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

  async getById(id: string, user: AuthUser): Promise<EventResponse> {
    const event = await this.prisma.authographsEvent.findFirst({
      where: {
        id,
        ...(user.role === UserRole.ADMIN
          ? {}
          : {
              unit: {
                userUnits: {
                  some: { userId: user.id },
                },
              },
            }),
      },
      include: eventInclude,
    });

    if (!event) throw new NotFoundEventException();

    return this.serializeEvent(event);
  }

  async getEventBookProduction(
    eventId: string,
    user: AuthUser,
  ): Promise<GetEventBookProductionResponse> {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedUserIsNotAdminException();
    }

    const event = await this.prisma.authographsEvent.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) throw new NotFoundEventException();

    const books = await this.prisma.book.findMany({
      where: {
        authographsEventId: eventId,
        orderItems: {
          some: {
            order: {
              status: OrderStatus.APPROVED,
            },
          },
        },
      },
      select: {
        id: true,
        magnificCode: true,
        title: true,
        interiorPdfUrl: true,
        coverPdfUrl: true,
        student: {
          select: {
            id: true,
            name: true,
            class: {
              select: {
                id: true,
                name: true,
                schoolYear: true,
                units: {
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
              },
            },
          },
        },
        orderItems: {
          where: {
            order: {
              status: OrderStatus.APPROVED,
            },
          },
          include: {
            order: {
              select: {
                id: true,
                createdAt: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [{ student: { name: 'asc' } }],
    });

    return books.map((book) => {
      let totalQuantity = 0;
      let waitingPrintQuantity = 0;
      let printedQuantity = 0;
      let deliveredToSchoolQuantity = 0;
      let deliveredToFamilyQuantity = 0;

      const orders = book.orderItems.map((item) => {
        totalQuantity += item.quantity;
        if (item.fulfillmentStatus === FulfillmentStatus.WAITING_PRINT) {
          waitingPrintQuantity += item.quantity;
        } else if (item.fulfillmentStatus === FulfillmentStatus.PRINTED) {
          printedQuantity += item.quantity;
        } else if (
          item.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_SCHOOL
        ) {
          deliveredToSchoolQuantity += item.quantity;
        } else if (
          item.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_FAMILY
        ) {
          deliveredToFamilyQuantity += item.quantity;
        }

        return {
          orderId: item.orderId,
          buyerName: item.order.user.name,
          buyerEmail: item.order.user.email,
          quantity: item.quantity,
          fulfillmentStatus: item.fulfillmentStatus as FulfillmentStatusEnum,
          printedAt: item.printedAt?.toISOString() ?? null,
          deliveredToSchoolAt: item.deliveredToSchoolAt?.toISOString() ?? null,
          deliveredToFamilyAt: item.deliveredToFamilyAt?.toISOString() ?? null,
          orderCreatedAt: item.order.createdAt.toISOString(),
        };
      });

      return {
        bookId: book.id,
        magnificCode: book.magnificCode,
        title: book.title,
        interiorPdfUrl: book.interiorPdfUrl,
        coverPdfUrl: book.coverPdfUrl,
        student: {
          id: book.student.id,
          name: book.student.name,
          class: {
            id: book.student.class.id,
            name: book.student.class.name,
            schoolYear: book.student.class.schoolYear,
            units: {
              id: book.student.class.units.id,
              name: book.student.class.units.name,
              school: {
                id: book.student.class.units.school.id,
                name: book.student.class.units.school.name,
              },
            },
          },
        },
        totalQuantity,
        waitingPrintQuantity,
        printedQuantity,
        deliveredToSchoolQuantity,
        deliveredToFamilyQuantity,
        orders,
      };
    });
  }

  async updateEventBookFulfillment(
    eventId: string,
    bookId: string,
    status: FulfillmentStatusEnum,
    user: AuthUser,
  ): Promise<UpdateFulfillmentResponse> {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedUserIsNotAdminException();
    }

    const book = await this.prisma.book.findFirst({
      where: { id: bookId, authographsEventId: eventId },
      select: { id: true },
    });

    if (!book) throw new NotFoundBookException();

    const now = new Date();
    const updateData: Prisma.OrderItemUpdateManyMutationInput = {
      fulfillmentStatus: status as FulfillmentStatus,
    };

    if (status === FulfillmentStatusEnum.WAITING_PRINT) {
      updateData.printedAt = null;
      updateData.deliveredToSchoolAt = null;
      updateData.deliveredToFamilyAt = null;
    } else if (status === FulfillmentStatusEnum.PRINTED) {
      updateData.printedAt = now;
      updateData.deliveredToSchoolAt = null;
      updateData.deliveredToFamilyAt = null;
    } else if (status === FulfillmentStatusEnum.DELIVERED_TO_SCHOOL) {
      updateData.deliveredToSchoolAt = now;
      updateData.deliveredToFamilyAt = null;
    } else if (status === FulfillmentStatusEnum.DELIVERED_TO_FAMILY) {
      updateData.deliveredToFamilyAt = now;
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        bookId,
        order: {
          status: OrderStatus.APPROVED,
        },
      },
      select: { orderId: true },
    });

    await this.prisma.orderItem.updateMany({
      where: {
        bookId,
        order: {
          status: OrderStatus.APPROVED,
        },
      },
      data: updateData,
    });

    const orderIds = [...new Set(orderItems.map((item) => item.orderId))];
    await Promise.all(orderIds.map((id) => this.syncOrderFulfillment(id)));

    return {
      success: true,
      message: `Status de produção atualizado para ${status}`,
    };
  }

  async updateEventOrderItemFulfillment(
    eventId: string,
    orderId: string,
    bookId: string,
    status: FulfillmentStatusEnum,
    user: AuthUser,
  ): Promise<UpdateFulfillmentResponse> {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedUserIsNotAdminException();
    }

    const orderItem = await this.prisma.orderItem.findUnique({
      where: {
        orderId_bookId: {
          orderId,
          bookId,
        },
      },
      include: {
        book: {
          select: { authographsEventId: true },
        },
      },
    });

    if (!orderItem || orderItem.book.authographsEventId !== eventId) {
      throw new NotFoundOrderItemException(orderId, bookId);
    }

    const now = new Date();
    const updateData: Prisma.OrderItemUpdateInput = {
      fulfillmentStatus: status as FulfillmentStatus,
    };

    if (status === FulfillmentStatusEnum.WAITING_PRINT) {
      updateData.printedAt = null;
      updateData.deliveredToSchoolAt = null;
      updateData.deliveredToFamilyAt = null;
    } else if (status === FulfillmentStatusEnum.PRINTED) {
      updateData.printedAt = now;
      updateData.deliveredToSchoolAt = null;
      updateData.deliveredToFamilyAt = null;
    } else if (status === FulfillmentStatusEnum.DELIVERED_TO_SCHOOL) {
      updateData.deliveredToSchoolAt = now;
      updateData.deliveredToFamilyAt = null;
    } else if (status === FulfillmentStatusEnum.DELIVERED_TO_FAMILY) {
      updateData.deliveredToFamilyAt = now;
    }

    await this.prisma.orderItem.update({
      where: {
        orderId_bookId: {
          orderId,
          bookId,
        },
      },
      data: updateData,
    });

    await this.syncOrderFulfillment(orderId);

    return {
      success: true,
      message: `Status do item atualizado para ${status}`,
    };
  }

  private async syncOrderFulfillment(orderId: string): Promise<void> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      select: { fulfillmentStatus: true },
    });

    if (!items || items.length === 0) return;

    const allDeliveredToFamily = items.every(
      (i) => i.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_FAMILY,
    );
    const allDeliveredToSchool = items.every(
      (i) =>
        i.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_SCHOOL ||
        i.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_FAMILY,
    );
    const allPrinted = items.every(
      (i) =>
        i.fulfillmentStatus === FulfillmentStatus.PRINTED ||
        i.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_SCHOOL ||
        i.fulfillmentStatus === FulfillmentStatus.DELIVERED_TO_FAMILY,
    );

    let newStatus: FulfillmentStatus = FulfillmentStatus.WAITING_PRINT;
    if (allDeliveredToFamily) {
      newStatus = FulfillmentStatus.DELIVERED_TO_FAMILY;
    } else if (allDeliveredToSchool) {
      newStatus = FulfillmentStatus.DELIVERED_TO_SCHOOL;
    } else if (allPrinted) {
      newStatus = FulfillmentStatus.PRINTED;
    }

    const orderUpdateData: Prisma.OrderUpdateInput = {
      fulfillmentStatus: newStatus,
    };
    if (newStatus !== FulfillmentStatus.DELIVERED_TO_FAMILY) {
      orderUpdateData.deliveredToFamilyAt = null;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: orderUpdateData,
    });
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

  async update(
    id: string,
    body: UpdateEventRequest,
    user: AuthUser,
  ): Promise<EventResponse> {
    if (user.role !== UserRole.ADMIN)
      throw new UnauthorizedUserIsNotAdminException();

    const event = await this.prisma.authographsEvent.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) throw new NotFoundEventException();

    const hasBooks = event._count ? event._count.books > 0 : false;
    if (hasBooks) {
      if (
        (body.unitId !== undefined && body.unitId !== event.unitId) ||
        (body.schoolYear !== undefined && body.schoolYear !== event.schoolYear)
      ) {
        throw new ConflictEventWithExistingBooksException();
      }
    }

    let targetUnitId = event.unitId;
    if (body.unitId && body.unitId !== event.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: body.unitId },
        select: {
          id: true,
          name: true,
        },
      });
      if (!unit) throw new NotFoundUnitException();

      const activeEvent = await this.prisma.authographsEvent.findFirst({
        where: {
          unitId: body.unitId,
          status: {
            in: [
              AuthographsEventStatus.PLANNED,
              AuthographsEventStatus.ONGOING,
            ],
          },
          id: { not: id },
        },
        select: { id: true },
      });

      if (activeEvent) throw new ConflictEventAlreadyActiveException(unit.name);
      targetUnitId = body.unitId;
    } else if (event.unitId) {
      const targetStatus = body.status ?? event.status;
      if (
        targetStatus === AuthographsEventStatus.PLANNED ||
        targetStatus === AuthographsEventStatus.ONGOING
      ) {
        const activeEvent = await this.prisma.authographsEvent.findFirst({
          where: {
            unitId: event.unitId,
            status: {
              in: [
                AuthographsEventStatus.PLANNED,
                AuthographsEventStatus.ONGOING,
              ],
            },
            id: { not: id },
          },
          select: { id: true },
        });

        if (activeEvent) {
          const unit = await this.prisma.unit.findUnique({
            where: { id: event.unitId },
            select: { name: true },
          });
          throw new ConflictEventAlreadyActiveException(unit?.name);
        }
      }
    }

    const targetEventDate = body.date ? new Date(body.date) : event.date;

    const useDefaultTimeline =
      body.useDefaultTimeline ?? body.timelineDates === undefined;

    let proposedTimelineDates: Date[] = [];

    if (useDefaultTimeline) {
      proposedTimelineDates = DEFAULT_TIMELINE_TEMPLATES.map((tpl) =>
        subtractDays(targetEventDate, tpl.offsetDays),
      );
    } else {
      if (!body.timelineDates || body.timelineDates.length !== 11) {
        throw new BadRequestTimelineOrderException();
      }
      proposedTimelineDates = body.timelineDates.map((d) => new Date(d));
    }

    // 1. Check chronological order
    for (let i = 0; i < proposedTimelineDates.length - 1; i++) {
      const current = proposedTimelineDates[i];
      const next = proposedTimelineDates[i + 1];
      if (current && next && current.getTime() > next.getTime()) {
        throw new BadRequestTimelineOrderException();
      }
    }

    // 2. Map existing timeline items for comparison
    const sortedTimelineDb = [...event.timeline].sort((a, b) => {
      const indexA = TIMELINE_ORDER.indexOf(a.details || '');
      const indexB = TIMELINE_ORDER.indexOf(b.details || '');
      return indexA - indexB;
    });

    // 3. Check that no MODIFIED date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDateString = (d: Date) => d.toISOString().slice(0, 10);

    for (let i = 0; i < proposedTimelineDates.length; i++) {
      const newDate = proposedTimelineDates[i];
      if (!newDate) continue;
      const oldItem = sortedTimelineDb[i];
      const oldDate = oldItem ? oldItem.date : null;

      const isModified =
        !oldDate || toDateString(newDate) !== toDateString(oldDate);

      if (isModified && newDate.getTime() < today.getTime()) {
        throw new BadRequestTimelinePastException();
      }
    }

    const timelineData = DEFAULT_TIMELINE_TEMPLATES.map((tpl, index) => {
      const pDate = proposedTimelineDates[index];
      if (!pDate) {
        throw new BadRequestTimelineOrderException();
      }
      return {
        date: pDate,
        details: tpl.details,
      };
    });

    const updatedEvent = await this.prisma.$transaction(async (tx) => {
      await tx.authographsEventTimeline.deleteMany({
        where: { eventId: id },
      });

      return tx.authographsEvent.update({
        where: { id },
        data: {
          name: body.name,
          date: targetEventDate,
          schoolYear: body.schoolYear,
          unitId: targetUnitId,
          status: body.status,
          timeline: {
            create: timelineData,
          },
        },
        include: eventInclude,
      });
    });

    return this.serializeEvent(updatedEvent);
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
      hasBooks: event._count ? event._count.books > 0 : false,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
