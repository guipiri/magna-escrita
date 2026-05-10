import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  AuthUser,
  GetClassesResponse,
  GetSchoolsResponse,
  ClassStudentResponse,
  UpdateClassStudentItem,
} from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import {
  BadRequestGradeNameAlreadyExistsException,
  NotFoundClassException,
  UnauthorizedUserNoAccessToUnitException,
} from './schools.errors.js';
import { SchoolsMapper } from './schools.mapper.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClasses(user: AuthUser): Promise<GetClassesResponse[]> {
    const classes = await this.prisma.class.findMany({
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
        enrollments: {
          select: {
            bookEnrollments: {
              select: {
                book: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
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

    const response: GetClassesResponse[] = classes.map((grade) => {
      const bookStatusCount = {
        total: 0,
        draft: 0,
        forReview: 0,
        ready: 0,
        archived: 0,
        completed: 0,
      };

      // Count unique books by status
      const uniqueBooksByStatus = new Map<string, Set<string>>();
      grade.enrollments.forEach((enrollment) => {
        enrollment.bookEnrollments.forEach((bookEnrollment) => {
          const bookId = bookEnrollment.book.id;
          const bookStatus = bookEnrollment.book.status;

          if (!uniqueBooksByStatus.has(bookStatus)) {
            uniqueBooksByStatus.set(bookStatus, new Set<string>());
          }
          uniqueBooksByStatus.get(bookStatus)!.add(bookId);
        });
      });

      // Count total unique books and books per status
      const allUniqueBookIds = new Set<string>();
      uniqueBooksByStatus.forEach((bookIds, status) => {
        const count = bookIds.size;
        bookIds.forEach((id) => allUniqueBookIds.add(id));

        if (status === 'DRAFT') bookStatusCount.draft = count;
        else if (status === 'FOR_REVIEW') bookStatusCount.forReview = count;
        else if (status === 'READY') bookStatusCount.ready = count;
        else if (status === 'ARCHIVED') bookStatusCount.archived = count;
      });

      bookStatusCount.total = allUniqueBookIds.size;

      // Set completed count based on user role
      if (user.role === UserRole.ADMIN) {
        bookStatusCount.completed = bookStatusCount.ready;
      } else {
        bookStatusCount.completed = bookStatusCount.forReview;
      }

      return {
        id: grade.id,
        name: grade.name,
        schoolYear: grade.schoolYear as GetClassesResponse['schoolYear'],
        school: {
          id: grade.units.school.id,
          name: grade.units.school.name,
        },
        unit: {
          id: grade.units.id,
          name: grade.units.name,
        },
        studentsCount: grade._count.enrollments,
        bookCount: bookStatusCount,
        createdAt: grade.createdAt.toISOString(),
      };
    });

    return response;
  }

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

  async createClass(
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

    const gradeNameExists = await this.prisma.class.findFirst({
      where: { name, unitId: unitIdtoUse },
    });

    if (gradeNameExists) throw new BadRequestGradeNameAlreadyExistsException();

    const createdClass = await this.prisma.class.create({
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
        classId: createdClass.id,
      }),
    );

    await this.prisma.enrollment.createMany({ data: enrollmentData });

    return {
      id: createdClass.id,
      name: createdClass.name,
      school: { id: units[0].unit.school.id, name: units[0].unit.school.name },
      unit: { id: units[0].unit.id, name: units[0].unit.name },
      students: students.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  async updateClass(id: string, name: string, user: AuthUser) {
    const existingClass = await this.prisma.class.findUnique({
      where: { id },
      include: { units: true },
    });

    if (!existingClass) throw new NotFoundClassException();

    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId: existingClass.unitId },
      });
      if (!access) throw new UnauthorizedUserNoAccessToUnitException();
    }

    const gradeNameExists = await this.prisma.class.findFirst({
      where: {
        name,
        unitId: existingClass.unitId,
        id: { not: id },
      },
    });

    if (gradeNameExists) throw new BadRequestGradeNameAlreadyExistsException();

    const updated = await this.prisma.class.update({
      where: { id },
      data: { name },
      select: { id: true, name: true },
    });

    return updated;
  }

  async deleteClass(id: string, user: AuthUser) {
    const existingClass = await this.prisma.class.findUnique({
      where: { id },
      include: { units: true },
    });

    if (!existingClass) throw new NotFoundClassException();

    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId: existingClass.unitId },
      });
      if (!access) throw new UnauthorizedUserNoAccessToUnitException();
    }

    await this.prisma.enrollment.deleteMany({ where: { classId: id } });
    await this.prisma.class.delete({ where: { id } });
  }

  async getClassStudents(
    classId: string,
    user: AuthUser,
  ): Promise<ClassStudentResponse[]> {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { units: true },
    });

    if (!classRecord) throw new NotFoundClassException();

    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId: classRecord.unitId },
      });
      if (!access) throw new UnauthorizedUserNoAccessToUnitException();
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      select: {
        id: true,
        student: {
          select: { id: true, name: true },
        },
      },
      orderBy: { student: { name: 'asc' } },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
      enrollmentId: enrollment.id,
    }));
  }

  async updateClassStudents(
    classId: string,
    students: UpdateClassStudentItem[],
    user: AuthUser,
  ) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { units: true },
    });

    if (!classRecord) throw new NotFoundClassException();

    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId: classRecord.unitId },
      });
      if (!access) throw new UnauthorizedUserNoAccessToUnitException();
    }

    const currentEnrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      select: { id: true, studentId: true },
    });

    const currentStudentIds = new Set(
      currentEnrollments.map((e) => e.studentId),
    );
    const newStudentIds = new Set(
      students.filter((s) => s.id).map((s) => s.id as string),
    );

    // const enrollmentMap = new Map(
    //   currentEnrollments.map((e) => [e.studentId, e.id]),
    // );

    const toDelete = currentEnrollments.filter(
      (e) => !newStudentIds.has(e.studentId),
    );

    if (toDelete.length > 0) {
      await this.prisma.bookEnrollment.deleteMany({
        where: { enrollmentId: { in: toDelete.map((e) => e.id) } },
      });
      await this.prisma.enrollment.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }

    const toCreate: Array<{ name: string }> = [];
    const toUpdate: Array<{ studentId: string; name: string }> = [];

    for (const student of students) {
      if (student.id && currentStudentIds.has(student.id)) {
        toUpdate.push({ studentId: student.id, name: student.name });
      } else if (!student.id) {
        toCreate.push({ name: student.name });
      }
    }

    for (const item of toUpdate) {
      await this.prisma.student.updateMany({
        where: { id: item.studentId },
        data: { name: item.name },
      });
    }

    if (toCreate.length > 0) {
      const createdStudents = await Promise.all(
        toCreate.map((item) =>
          this.prisma.student.create({ data: { name: item.name.trim() } }),
        ),
      );

      await this.prisma.enrollment.createMany({
        data: createdStudents.map((s) => ({
          studentId: s.id,
          classId,
        })),
      });
    }

    return this.getClassStudents(classId, user);
  }
}
