import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  GetPricesResponse,
  CreatePriceRequest,
  CreatePriceResponse,
  UpdatePriceRequest,
} from '@repo/shared';
import {
  BadRequestDuplicateMinQuantityException,
  NotFoundPriceException,
} from './prices.errors.js';
import { NotFoundClassException } from '../classes/classes.errors.js';
import { BookStatus } from '@prisma/client';

@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrices(): Promise<GetPricesResponse[]> {
    const prices = await this.prisma.price.findMany({
      include: {
        tiers: {
          orderBy: { minQuantity: 'asc' },
        },
        classes: {
          include: {
            units: {
              include: {
                school: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prices.map((price) => ({
      id: price.id,
      name: price.name,
      tiers: price.tiers.map((tier) => ({
        id: tier.id,
        minQuantity: tier.minQuantity,
        unitPrice: Number(tier.unitPrice),
      })),
      classes: price.classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        schoolName: cls.units.school.name,
        unitName: cls.units.name,
      })),
    }));
  }

  async createPrice(body: CreatePriceRequest): Promise<CreatePriceResponse> {
    const quantities = body.tiers.map((t) => t.minQuantity);
    const hasDuplicates = new Set(quantities).size !== quantities.length;
    if (hasDuplicates) {
      throw new BadRequestDuplicateMinQuantityException();
    }

    if (body.classIds && body.classIds.length > 0) {
      const classesCount = await this.prisma.class.count({
        where: { id: { in: body.classIds } },
      });
      if (classesCount !== body.classIds.length) {
        throw new NotFoundClassException();
      }
    }

    const price = await this.prisma.$transaction(async (tx) => {
      const newPrice = await tx.price.create({
        data: {
          name: body.name,
          tiers: {
            createMany: {
              data: body.tiers.map((t) => ({
                minQuantity: t.minQuantity,
                unitPrice: t.unitPrice,
              })),
            },
          },
        },
      });

      if (body.classIds && body.classIds.length > 0) {
        await tx.class.updateMany({
          where: { id: { in: body.classIds } },
          data: { priceId: newPrice.id },
        });

        await tx.book.updateMany({
          where: {
            student: {
              classId: { in: body.classIds },
            },
            status: BookStatus.REVISED_BY_MAGNA,
          },
          data: {
            status: BookStatus.READY_FOR_SALE,
          },
        });
      }

      return newPrice;
    });

    return {
      id: price.id,
      name: price.name,
    };
  }

  async updatePrice(
    id: string,
    body: UpdatePriceRequest,
  ): Promise<CreatePriceResponse> {
    const priceExists = await this.prisma.price.findUnique({
      where: { id },
    });
    if (!priceExists) {
      throw new NotFoundPriceException();
    }

    const quantities = body.tiers.map((t) => t.minQuantity);
    const hasDuplicates = new Set(quantities).size !== quantities.length;
    if (hasDuplicates) {
      throw new BadRequestDuplicateMinQuantityException();
    }

    if (body.classIds && body.classIds.length > 0) {
      const classesCount = await this.prisma.class.count({
        where: { id: { in: body.classIds } },
      });
      if (classesCount !== body.classIds.length) {
        throw new NotFoundClassException();
      }
    }

    const price = await this.prisma.$transaction(async (tx) => {
      const currentClasses = await tx.class.findMany({
        where: { priceId: id },
        select: { id: true },
      });
      const currentClassIds = currentClasses.map((c) => c.id);

      const addedClassIds = body.classIds.filter(
        (cid) => !currentClassIds.includes(cid),
      );
      const removedClassIds = currentClassIds.filter(
        (cid) => !body.classIds.includes(cid),
      );

      const updatedPrice = await tx.price.update({
        where: { id },
        data: {
          name: body.name,
        },
      });

      await tx.priceTier.deleteMany({
        where: { priceId: id },
      });

      await tx.priceTier.createMany({
        data: body.tiers.map((t) => ({
          priceId: id,
          minQuantity: t.minQuantity,
          unitPrice: t.unitPrice,
        })),
      });

      if (removedClassIds.length > 0) {
        await tx.class.updateMany({
          where: { id: { in: removedClassIds } },
          data: { priceId: null },
        });

        await tx.book.updateMany({
          where: {
            student: {
              classId: { in: removedClassIds },
            },
            status: BookStatus.READY_FOR_SALE,
          },
          data: {
            status: BookStatus.REVISED_BY_MAGNA,
          },
        });
      }

      if (addedClassIds.length > 0) {
        await tx.class.updateMany({
          where: { id: { in: addedClassIds } },
          data: { priceId: id },
        });

        await tx.book.updateMany({
          where: {
            student: {
              classId: { in: addedClassIds },
            },
            status: BookStatus.REVISED_BY_MAGNA,
          },
          data: {
            status: BookStatus.READY_FOR_SALE,
          },
        });
      }

      return updatedPrice;
    });

    return {
      id: price.id,
      name: price.name,
    };
  }
}
