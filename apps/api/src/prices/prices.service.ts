import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { GetPricesResponse } from '@repo/shared';

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
}
