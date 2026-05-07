import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, GetSchoolsResponse } from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import { UnauthorizedUserNoAccessToUnitException } from './schools.errors.js';
import { SchoolsMapper } from './schools.mapper.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchoolUnits(user: AuthUser): Promise<GetSchoolsResponse[]> {
    console.log('Getting school units for user:', user);
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

  async createGrade(
    name: string,
    studentNames: string[],
    user: AuthUser,
    unitId?: string,
    schoolYear?: string,
  ) {
    const unit = await this.prisma.userUnit.findMany({
      where: { userId: user.id, unitId },
      select: {
        id: true,
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
      },
    });

    if (!unitId && unit.length > 1)
      throw new Error(
        'User has access to multiple units, unitId must be provided',
      );

    if (!unit[0] || unit.length === 0)
      throw new UnauthorizedUserNoAccessToUnitException();

    const unitIdtoUse = unitId || unit[0].unit.id;

    const grade = await this.prisma.grade.create({
      data: {
        name,
        unitId: unitIdtoUse,
        schoolYear: SchoolsMapper.schoolYearStringToPrisma(schoolYear),
      },
      select: {
        id: true,
        name: true,
      },
    });

    const students = await Promise.all(
      studentNames.map((studentName) =>
        this.prisma.student.create({
          data: { name: studentName.trim() },
        }),
      ),
    );

    const enrollmentData: Prisma.EnrollmentCreateManyInput[] = students.map(
      (s) => ({
        studentId: s.id,
        gradeId: grade.id,
      }),
    );

    await this.prisma.enrollment.createMany({ data: enrollmentData });

    return {
      id: grade.id,
      name: grade.name,
      school: { id: unit[0].unit.school.id, name: unit[0].unit.school.name },
      unit: { id: unit[0].unit.id, name: unit[0].unit.name },
      students: students.map((s) => ({ id: s.id, name: s.name })),
    };
  }
}
