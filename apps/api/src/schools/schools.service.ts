import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  AuthUser,
  GetSchoolsResponse,
  GetSchoolsListResponse,
  GetSchoolDetailResponse,
  UpdateSchoolRequest,
  UpdateSchoolResponse,
  SchoolYear,
  SchoolYearOption,
  UserRole,
} from '@repo/shared';
import { UnauthorizedAccessToCreateSchoolException } from '../auth/auth.erros.js';
import {
  NotFoundSchoolException,
  UnauthorizedUserIsNotAdminException,
  ConflictSchoolHasAssociatedEntitiesException,
  ConflictUnitHasAssociatedEntitiesException,
} from './schools.errors.js';
import {
  BookStatus,
  Prisma,
  SchoolYear as PrismaSchoolYear,
} from '@prisma/client';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import type { BucketService } from '../common/bucket/bucket.contract.js';
import { getUnitLogoBucketKey } from '../common/bucket/bucket.utils.js';

const selectSchoolUnits: Prisma.SchoolSelect = {
  id: true,
  name: true,
  units: {
    select: {
      id: true,
      name: true,
      bookTemplates: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('BucketService')
    private readonly bucketService: BucketService,
  ) {}

  async getSchoolUnits(user: AuthUser): Promise<GetSchoolsResponse[]> {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.school.findMany({
        select: selectSchoolUnits,
        orderBy: { name: 'asc' },
      });
    }

    const schools = await this.prisma.school.findMany({
      where: { units: { some: { userUnits: { some: { userId: user.id } } } } },
      select: {
        id: true,
        name: true,
        units: {
          where: { userUnits: { some: { userId: user.id } } },
          select: {
            id: true,
            name: true,
            bookTemplates: { select: { id: true, name: true } },
          },
        },
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
            _count: {
              select: {
                classes: true,
                userUnits: true,
                authographsEvents: true,
                bookTemplates: true,
              },
            },
            classes: {
              where: { schoolYear: SchoolYear.YEAR_2026 },
              select: {
                updatedAt: true,
                students: {
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
          studentCount += cls.students.length;

          if (cls.updatedAt > lastActivity) lastActivity = cls.updatedAt;

          for (const student of cls.students) {
            for (const be of student.books) {
              allBookIds.add(be.id);

              const isCompleted =
                user.role === UserRole.ADMIN
                  ? be.status === BookStatus.REVISED_BY_MAGNA
                  : be.status === BookStatus.REVISED_BY_SCHOOL;

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

      const canDelete =
        school.units.length === 0 ||
        school.units.every(
          (unit) =>
            unit._count.classes === 0 &&
            unit._count.userUnits === 0 &&
            unit._count.authographsEvents === 0 &&
            unit._count.bookTemplates === 0,
        );

      return {
        id: school.id,
        name: school.name,
        classCount,
        studentCount,
        bookCount: allBookIds.size,
        status,
        lastActivity: lastActivity.toISOString(),
        canDelete,
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

  async uploadUnitLogo(
    unitId: string,
    logo: Express.Multer.File,
    user: AuthUser,
  ) {
    if (user.role !== UserRole.ADMIN) {
      const hasAccess = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId },
      });
      if (!hasAccess) throw new Error('Unauthorized');
    }

    const ext =
      logo.mimetype === 'image/png'
        ? 'png'
        : logo.mimetype === 'image/webp'
          ? 'webp'
          : 'jpg';
    const key = getUnitLogoBucketKey(unitId, ext);
    const logoUrl = await this.bucketService.upload({
      key,
      body: logo.buffer,
      contentType: logo.mimetype,
    });

    await this.prisma.unit.update({
      where: { id: unitId },
      data: { logoUrl },
    });

    return { logoUrl };
  }

  async getSchoolById(
    id: string,
    user: AuthUser,
  ): Promise<GetSchoolDetailResponse> {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedUserIsNotAdminException();
    }

    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            _count: {
              select: {
                classes: true,
                userUnits: true,
                authographsEvents: true,
                bookTemplates: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!school) {
      throw new NotFoundSchoolException();
    }

    const canDelete =
      school.units.length === 0 ||
      school.units.every(
        (unit) =>
          unit._count.classes === 0 &&
          unit._count.userUnits === 0 &&
          unit._count.authographsEvents === 0 &&
          unit._count.bookTemplates === 0,
      );

    return {
      id: school.id,
      name: school.name,
      canDelete,
      units: school.units.map((unit) => ({
        id: unit.id,
        name: unit.name,
        hasAssociatedEntities:
          unit._count.classes > 0 ||
          unit._count.userUnits > 0 ||
          unit._count.authographsEvents > 0 ||
          unit._count.bookTemplates > 0,
        classesCount: unit._count.classes,
        eventsCount: unit._count.authographsEvents,
        usersCount: unit._count.userUnits,
        templatesCount: unit._count.bookTemplates,
      })),
    };
  }

  async updateSchool(
    id: string,
    payload: UpdateSchoolRequest,
    user: AuthUser,
  ): Promise<UpdateSchoolResponse> {
    if (user.role !== UserRole.ADMIN)
      throw new UnauthorizedUserIsNotAdminException();

    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            _count: {
              select: {
                classes: true,
                userUnits: true,
                authographsEvents: true,
                bookTemplates: true,
              },
            },
          },
        },
      },
    });

    if (!school) throw new NotFoundSchoolException();

    const currentUnitMap = new Map(school.units.map((u) => [u.id, u]));

    const payloadUnitIds = new Set(
      payload.units
        .map((u) => u.id)
        .filter((unitId): unitId is string => Boolean(unitId)),
    );

    const unitsToDelete = school.units.filter((u) => !payloadUnitIds.has(u.id));

    for (const unit of unitsToDelete) {
      const hasEntities =
        unit._count.classes > 0 ||
        unit._count.userUnits > 0 ||
        unit._count.authographsEvents > 0 ||
        unit._count.bookTemplates > 0;

      if (hasEntities) throw new ConflictUnitHasAssociatedEntitiesException();
    }

    const unitsToUpdate = payload.units.filter(
      (u) => u.id && currentUnitMap.has(u.id),
    );
    const unitsToCreate = payload.units.filter((u) => !u.id);

    return this.prisma.$transaction(async (tx) => {
      if (unitsToDelete.length > 0) {
        await tx.unit.deleteMany({
          where: { id: { in: unitsToDelete.map((u) => u.id) } },
        });
      }

      for (const unit of unitsToUpdate) {
        await tx.unit.update({
          where: { id: unit.id },
          data: { name: unit.name.trim() },
        });
      }

      for (const unit of unitsToCreate) {
        if (unit.name.trim()) {
          await tx.unit.create({
            data: {
              name: unit.name.trim(),
              schoolId: id,
            },
          });
        }
      }

      const updatedSchool = await tx.school.update({
        where: { id },
        data: { name: payload.name.trim() },
        select: {
          id: true,
          name: true,
          units: {
            select: { id: true, name: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return updatedSchool;
    });
  }

  async deleteSchool(
    id: string,
    user: AuthUser,
  ): Promise<{ success: boolean }> {
    if (user.role !== UserRole.ADMIN)
      throw new UnauthorizedUserIsNotAdminException();

    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            _count: {
              select: {
                classes: true,
                userUnits: true,
                authographsEvents: true,
                bookTemplates: true,
              },
            },
          },
        },
      },
    });

    if (!school) throw new NotFoundSchoolException();

    const hasAssociatedEntities = school.units.some(
      (unit) =>
        unit._count.classes > 0 ||
        unit._count.userUnits > 0 ||
        unit._count.authographsEvents > 0 ||
        unit._count.bookTemplates > 0,
    );

    if (hasAssociatedEntities)
      throw new ConflictSchoolHasAssociatedEntitiesException();

    await this.prisma.$transaction(async (tx) => {
      await tx.unit.deleteMany({
        where: { schoolId: id },
      });
      await tx.school.delete({
        where: { id },
      });
    });

    return { success: true };
  }
}
