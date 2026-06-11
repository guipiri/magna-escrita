import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  AuthUser,
  GetClassesResponse,
  ClassStudentResponse,
  UpdateClassStudentItem,
  getCurrentSchoolYear,
} from '@repo/shared';
import { UserRole } from '@repo/shared/dist/types/user.js';
import {
  BadRequestGradeNameAlreadyExistsException,
  BadRequestMultipleUnitsAccessException,
  BadRequestNoValidUnitIdException,
  ConflictExistingBooksException,
  NotFoundClassException,
} from './classes.errors.js';
import { SchoolsMapper } from '../schools/schools.mapper.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassesService {
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
        bookTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
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
        students: {
          select: {
            books: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    const response = classes.map((_class) => {
      const bookStatusCount = {
        total: 0,
        draft: 0,
        forReview: 0,
        ready: 0,
        archived: 0,
        completed: 0,
      };

      const uniqueBooksByStatus = new Map<string, Set<string>>();
      _class.students.forEach((student) => {
        student.books.forEach((book) => {
          const bookId = String(book.id);
          const bookStatus = String(book.status);

          if (!uniqueBooksByStatus.has(bookStatus)) {
            uniqueBooksByStatus.set(bookStatus, new Set<string>());
          }
          uniqueBooksByStatus.get(bookStatus)!.add(bookId);
        });
      });

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

      if (user.role === UserRole.ADMIN) {
        bookStatusCount.completed = bookStatusCount.ready;
      } else {
        bookStatusCount.completed = bookStatusCount.forReview;
      }

      return {
        id: _class.id,
        name: _class.name,
        teacherName: _class.teacherName,
        bookTemplate: _class.bookTemplate,
        schoolYear: _class.schoolYear as GetClassesResponse['schoolYear'],
        school: {
          id: _class.units.school.id,
          name: _class.units.school.name,
        },
        unit: {
          id: _class.units.id,
          name: _class.units.name,
        },
        studentsCount: _class._count.students,
        bookCount: bookStatusCount,
        createdAt: _class.createdAt.toISOString(),
      };
    }) satisfies GetClassesResponse[];

    return response;
  }

  async createClass(
    name: string,
    studentNames: string[],
    teacherName: string,
    user: AuthUser,
    bookTemplateId: string,
    unitId?: string,
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
      throw new BadRequestNoValidUnitIdException();

    if (!unitId && !units[0]?.unit.id)
      throw new BadRequestNoValidUnitIdException();

    const unitIdtoUse = (unitId || units[0]?.unit.id)!;

    const gradeNameExists = await this.prisma.class.findFirst({
      where: { name, unitId: unitIdtoUse },
    });

    if (gradeNameExists) throw new BadRequestGradeNameAlreadyExistsException();

    const existingBookTemplate = await this.prisma.bookTemplate.findUnique({
      where: { id: bookTemplateId },
      select: { id: true },
    });

    if (!existingBookTemplate) throw new Error('Book template not found');

    const createdClass = await this.prisma.class.create({
      data: {
        name,
        teacherName,
        unitId: unitIdtoUse,
        bookTemplateId: existingBookTemplate.id,
        schoolYear: SchoolsMapper.schoolYearDomainToPrisma(
          getCurrentSchoolYear(),
        ),
      },
      select: {
        id: true,
        name: true,
      },
    });

    const students = await Promise.all(
      studentNames.map((studentName) =>
        this.prisma.student.create({
          data: { name: studentName.trim(), classId: createdClass.id },
        }),
      ),
    );

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
      bookTemplateId?: string;
      students?: UpdateClassStudentItem[];
    },
    user: AuthUser,
  ) {
    const { name, teacherName, bookTemplateId, students } = payload;

    const existingClass = await this.prisma.class.findUnique({
      where: { id },
      include: { units: true },
    });

    if (!existingClass) throw new NotFoundClassException();

    if (user.role !== UserRole.ADMIN) {
      const access = await this.prisma.userUnit.findFirst({
        where: { userId: user.id, unitId: existingClass.unitId },
      });
      if (!access) throw new BadRequestNoValidUnitIdException();
    }

    const gradeNameExists = await this.prisma.class.findFirst({
      where: {
        name,
        unitId: existingClass.unitId,
        id: { not: id },
      },
    });

    if (gradeNameExists) throw new BadRequestGradeNameAlreadyExistsException();

    if (students) {
      const currentStudents = await this.prisma.student.findMany({
        where: { classId: id },
        select: { id: true },
      });

      const currentStudentIds = new Set(currentStudents.map((e) => e.id));

      const toDelete = currentStudents.filter(
        (e) => !students.some((s) => s.id && s.id === e.id),
      );

      if (toDelete.length > 0) {
        const existingBooks = await this.prisma.book.count({
          where: { studentId: { in: toDelete.map((e) => e.id) } },
        });
        if (existingBooks > 0) throw new ConflictExistingBooksException();

        await this.prisma.student.deleteMany({
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
        await Promise.all(
          toCreate.map((item) =>
            this.prisma.student.create({
              data: { name: item.name.trim(), classId: id },
            }),
          ),
        );
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        name,
        teacherName,
        ...(bookTemplateId ? { bookTemplateId } : {}),
      },
      select: { id: true, name: true, teacherName: true, bookTemplateId: true },
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
      if (!access) throw new BadRequestNoValidUnitIdException();
    }

    await this.prisma.book.deleteMany({
      where: { student: { classId: id } },
    });
    await this.prisma.student.deleteMany({
      where: { classId: id },
    });
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
      if (!access) throw new BadRequestNoValidUnitIdException();
    }

    const studentsList = await this.prisma.student.findMany({
      where: { classId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return studentsList.map((student) => ({
      id: student.id,
      name: student.name,
      studentId: student.id,
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
      if (!access) throw new BadRequestNoValidUnitIdException();
    }

    const currentStudents = await this.prisma.student.findMany({
      where: { classId },
      select: { id: true },
    });

    const currentStudentIds = new Set(currentStudents.map((e) => e.id));
    const newStudentIds = new Set(
      students.filter((s) => s.id).map((s) => s.id as string),
    );

    const toDelete = currentStudents.filter((e) => !newStudentIds.has(e.id));

    if (toDelete.length > 0) {
      const hasExistingBooks = await this.prisma.book.findMany({
        where: { studentId: { in: toDelete.map((e) => e.id) } },
      });

      if (hasExistingBooks.length > 0) {
        throw new ConflictExistingBooksException();
      }

      await this.prisma.student.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }

    const toCreate: Array<{ name: string }> = [];
    const toUpdate: Array<{ id: string; name: string }> = [];

    for (const student of students) {
      if (student.id && currentStudentIds.has(student.id)) {
        toUpdate.push({ id: student.id, name: student.name });
      } else if (!student.id) {
        toCreate.push({ name: student.name });
      }
    }

    for (const item of toUpdate) {
      await this.prisma.student.updateMany({
        where: { id: item.id },
        data: { name: item.name },
      });
    }

    if (toCreate.length > 0) {
      await Promise.all(
        toCreate.map((item) =>
          this.prisma.student.create({
            data: { name: item.name.trim(), classId },
          }),
        ),
      );
    }

    return this.getClassStudents(classId, user);
  }
}
