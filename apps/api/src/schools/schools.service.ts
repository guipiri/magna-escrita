import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, GetGradesResponse, GetSchoolsResponse } from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import {
  BadRequestGradeNameAlreadyExistsException,
  UnauthorizedUserNoAccessToUnitException,
} from './schools.errors.js';
import { SchoolsMapper } from './schools.mapper.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGrades(user: AuthUser): Promise<GetGradesResponse[]> {
    const grades = await this.prisma.grade.findMany({
      where:
        user.role === UserRole.ADMIN
          ? undefined
          : {
              units: {
                userUnits: {
                  some: { userId: user.id },
                },
              },
            },
      select: {
        id: true,
        name: true,
        schoolYear: true,
        createdAt: true,
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
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    return grades.map((grade) => ({
      id: grade.id,
      name: grade.name,
      schoolYear: grade.schoolYear as GetGradesResponse['schoolYear'],
      school: {
        id: grade.units.school.id,
        name: grade.units.school.name,
      },
      unit: {
        id: grade.units.id,
        name: grade.units.name,
      },
      studentsCount: grade._count.enrollments,
      createdAt: grade.createdAt.toISOString(),
    }));
  }

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
    const units = await this.prisma.userUnit.findMany({
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

    if (!unitId && units.length > 1)
      throw new Error(
        'User has access to multiple units, unitId must be provided',
      );

    if (!units[0] || units.length === 0)
      throw new UnauthorizedUserNoAccessToUnitException();

    const unitIdtoUse = unitId || units[0].unit.id;

    const gradeNameExists = await this.prisma.grade.findFirst({
      where: { name, unitId: unitIdtoUse },
    });

    if (gradeNameExists) throw new BadRequestGradeNameAlreadyExistsException();

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
      school: { id: units[0].unit.school.id, name: units[0].unit.school.name },
      unit: { id: units[0].unit.id, name: units[0].unit.name },
      students: students.map((s) => ({ id: s.id, name: s.name })),
    };
  }
}
