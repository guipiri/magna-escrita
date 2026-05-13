import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  AuthUser,
  GetClassesResponse,
  GetSchoolsResponse,
  GetSchoolsListResponse,
  ClassStudentResponse,
  UpdateClassStudentItem,
  SchoolYear,
  SchoolYearOption,
} from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import {
  BadRequestGradeNameAlreadyExistsException,
  BadRequestMultipleUnitsAccessException,
  BadRequestNoValidUnitIdException,
  NotFoundClassException,
  UnauthorizedUserNoAccessToUnitException,
} from './schools.errors.js';
import { SchoolsMapper } from './schools.mapper.js';
import { Prisma, SchoolYear as PrismaSchoolYear } from '@prisma/client';
import { UnauthorizedAccessToCreateSchoolException } from '../auth/auth.erros.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';

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
        teacherName: true,
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
                enrollmentId: true,
                bookId: true,
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

    const response: GetClassesResponse[] = classes.map((_class) => {
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
      _class.enrollments.forEach((enrollment) => {
        enrollment.bookEnrollments.forEach((bookEnrollment) => {
          const bookId = String(bookEnrollment.book.id);
          const bookStatus = String(bookEnrollment.book.status);

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
        id: _class.id,
        name: _class.name,
        teacherName: _class.teacherName,
        schoolYear: _class.schoolYear as GetClassesResponse['schoolYear'],
        school: {
          id: _class.units.school.id,
          name: _class.units.school.name,
        },
        unit: {
          id: _class.units.id,
          name: _class.units.name,
        },
        studentsCount: _class._count.enrollments,
        bookCount: bookStatusCount,
        createdAt: _class.createdAt.toISOString(),
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
                    bookEnrollments: {
                      select: {
                        enrollmentId: true,
                        bookId: true,
                        book: { select: { id: true, status: true } },
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
            for (const be of enrollment.bookEnrollments) {
              allBookIds.add(be.book.id);

              const isCompleted =
                user.role === UserRole.ADMIN
                  ? be.book.status === 'READY'
                  : be.book.status === 'FOR_REVIEW';

              if (isCompleted) completedBookIds.add(be.book.id);
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

  async createClass(
    name: string,
    studentNames: string[],
    teacherName: string,
    user: AuthUser,
    unitId?: string,
    schoolYear?: SchoolYear,
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

    if (!unitId && (units.length > 1 || user.role === UserRole.ADMIN))
      throw new BadRequestMultipleUnitsAccessException();

    if (!units[0] && user.role !== UserRole.ADMIN)
      throw new UnauthorizedUserNoAccessToUnitException();

    if (!unitId && !units[0]?.unit.id)
      throw new BadRequestNoValidUnitIdException();

    const unitIdtoUse = (unitId || units[0]?.unit.id)!;

    const gradeNameExists = await this.prisma.class.findFirst({
      where: { name, unitId: unitIdtoUse },
    });

    if (gradeNameExists) throw new BadRequestGradeNameAlreadyExistsException();

    const createdClass = await this.prisma.class.create({
      data: {
        name,
        teacherName,
        unitId: unitIdtoUse,
        schoolYear: SchoolsMapper.schoolYearDomainToPrisma(schoolYear),
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
      school: {
        id: units[0]?.unit.school.id,
        name: units[0]?.unit.school.name,
      },
      unit: { id: units[0]?.unit.id, name: units[0]?.unit.name },
      students: students.map((s) => ({ id: s.id, name: s.name })),
    };
  }

  async updateClass(
    id: string,
    payload: {
      name: string;
      teacherName: string;
      students?: UpdateClassStudentItem[];
    },
    user: AuthUser,
  ) {
    const { name, teacherName, students } = payload;

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

    // Handle students update if provided
    if (students) {
      const currentEnrollments = await this.prisma.enrollment.findMany({
        where: { classId: id },
        select: { id: true, studentId: true },
      });

      const currentStudentIds = new Set(
        currentEnrollments.map((e) => e.studentId),
      );

      const toDelete = currentEnrollments.filter(
        (e) => !students.some((s) => s.id && s.id === e.studentId),
      );

      if (toDelete.length > 0) {
        await this.prisma.bookEnrollment.deleteMany({
          where: { enrollmentId: { in: toDelete.map((e) => e.id) } },
        });
        await this.prisma.enrollment.deleteMany({
          where: { id: { in: toDelete.map((e) => e.id) } },
        });
      }

      const toUpdate = students.filter(
        (s) => s.id && currentStudentIds.has(s.id),
      );
      const toCreate = students.filter((s) => !s.id);

      for (const item of toUpdate) {
        await this.prisma.student.updateMany({
          where: { id: item.id },
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
          data: createdStudents.map((s) => ({ studentId: s.id, classId: id })),
        });
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: { name, teacherName },
      select: { id: true, name: true, teacherName: true },
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
