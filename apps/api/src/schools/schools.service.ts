import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  AuthUser,
  GetSchoolsResponse,
  GetSchoolsListResponse,
  SchoolYear,
  SchoolYearOption,
} from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import { UnauthorizedAccessToCreateSchoolException } from '../auth/auth.erros.js';
import { SchoolYear as PrismaSchoolYear } from '@prisma/client';
import { CreateSchoolDto } from './dto/create-school.dto.js';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchoolUnits(user: AuthUser): Promise<GetSchoolsResponse[]> {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.school.findMany({
        select: {
          id: true,
          name: true,
          units: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      });
    }

    const schools = await this.prisma.school.findMany({
      where: { units: { some: { userUnits: { some: { userId: user.id } } } } },
      select: {
        id: true,
        name: true,
        units: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return schools;
  }

  async getSchools(user: AuthUser): Promise<GetSchoolsListResponse[]> {
    const where =
      user.role === UserRole.ADMIN
        ? {}
        : {
            units: {
              some: { userUnits: { some: { userId: user.id } } },
            },
          };

    const schools = await this.prisma.school.findMany({
      where,
      include: {
        units: {
          include: {
            classes: {
              where: { schoolYear: SchoolYear.YEAR_2026 },
              select: {
                updatedAt: true,
                enrollments: {
                  select: {
                    id: true,
                    books: {
                      select: {
                        id: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return schools.map((school) => {
      let classCount = 0;
      let studentCount = 0;
      const allBookIds = new Set<string>();
      const completedBookIds = new Set<string>();
      let lastActivity = school.updatedAt;

      for (const unit of school.units) {
        classCount += unit.classes.length;

        for (const cls of unit.classes) {
          studentCount += cls.enrollments.length;

          if (cls.updatedAt > lastActivity) lastActivity = cls.updatedAt;

          for (const enrollment of cls.enrollments) {
            for (const be of enrollment.books) {
              allBookIds.add(be.id);

              const isCompleted =
                user.role === UserRole.ADMIN
                  ? be.status === 'READY'
                  : be.status === 'FOR_REVIEW';

              if (isCompleted) completedBookIds.add(be.id);
            }
          }
        }
      }

      let status: GetSchoolsListResponse['status'] = 'active';
      if (allBookIds.size > 0) {
        if (completedBookIds.size === allBookIds.size) {
          status = 'completed';
        } else if (completedBookIds.size > 0) {
          status = 'in-progress';
        }
      }

      return {
        id: school.id,
        name: school.name,
        classCount,
        studentCount,
        bookCount: allBookIds.size,
        status,
        lastActivity: lastActivity.toISOString(),
      };
    });
  }

  getSchoolYears(): SchoolYearOption[] {
    return Object.values(PrismaSchoolYear).map((schoolYear) => ({
      value: schoolYear as SchoolYear,
      label: schoolYear.replace('YEAR_', ''),
    }));
  }

  async createSchool({ name, unitNames }: CreateSchoolDto, user: AuthUser) {
    if (user.role !== UserRole.ADMIN)
      throw new UnauthorizedAccessToCreateSchoolException();

    const school = await this.prisma.school.create({
      data: {
        name,
        units: {
          create: unitNames.map((unitName) => ({ name: unitName })),
        },
      },
      select: {
        id: true,
        name: true,
        units: { select: { id: true, name: true } },
      },
    });

    return school;
  }
}
