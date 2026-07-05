import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import { AuthUser, UserListResponse, UserRole } from '@repo/shared';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import {
  BadRequestSchoolUserWithoutUnitsException,
  BadRequestInvalidRoleForUserCreationException,
  ConflictEmailAlreadyExistsException,
  NotFoundUserException,
  BadRequestCannotDeleteSelfException,
} from './users.errors.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(currentUser: AuthUser): Promise<UserListResponse[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SCHOOL],
        },
      },
      include: {
        units: {
          include: {
            unit: {
              include: {
                school: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role as unknown as UserRole,
      createdAt: user.createdAt.toISOString(),
      units: user.units.map((uu) => ({
        id: uu.unit.id,
        name: uu.unit.name,
        schoolName: uu.unit.school.name,
      })),
    }));
  }

  async createUser(
    data: CreateUserDto,
    currentUser: AuthUser,
  ): Promise<UserListResponse> {
    const email = data.email.trim().toLowerCase();

    // 1. Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictEmailAlreadyExistsException();
    }

    // 2. Validate role
    if (data.role !== UserRole.ADMIN && data.role !== UserRole.SCHOOL) {
      throw new BadRequestInvalidRoleForUserCreationException();
    }

    // 3. Validate units for SCHOOL role
    if (
      data.role === UserRole.SCHOOL &&
      (!data.unitIds || data.unitIds.length === 0)
    ) {
      throw new BadRequestSchoolUserWithoutUnitsException();
    }

    const prismaRole = data.role === UserRole.ADMIN ? Role.ADMIN : Role.SCHOOL;
    const googleId = `pending-${email}`;

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        googleId,
        role: prismaRole,
        name: null,
        picture: null,
        units:
          data.role === UserRole.SCHOOL && data.unitIds
            ? {
                create: data.unitIds.map((unitId) => ({
                  unitId,
                })),
              }
            : undefined,
      },
      include: {
        units: {
          include: {
            unit: {
              include: {
                school: true,
              },
            },
          },
        },
      },
    });

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      picture: createdUser.picture,
      role: createdUser.role as unknown as UserRole,
      createdAt: createdUser.createdAt.toISOString(),
      units: createdUser.units.map((uu) => ({
        id: uu.unit.id,
        name: uu.unit.name,
        schoolName: uu.unit.school.name,
      })),
    };
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    currentUser: AuthUser,
  ): Promise<UserListResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        units: true,
      },
    });
    if (!existingUser) {
      throw new NotFoundUserException();
    }

    let email = existingUser.email;
    if (data.email) {
      email = data.email.trim().toLowerCase();
      if (email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email },
        });
        if (emailExists) {
          throw new ConflictEmailAlreadyExistsException();
        }
      }
    }

    const newRole = data.role ?? (existingUser.role as unknown as UserRole);
    if (newRole !== UserRole.ADMIN && newRole !== UserRole.SCHOOL) {
      throw new BadRequestInvalidRoleForUserCreationException();
    }

    if (newRole === UserRole.SCHOOL) {
      const newUnitIds =
        data.unitIds ?? existingUser.units.map((u) => u.unitId);
      if (!newUnitIds || newUnitIds.length === 0) {
        throw new BadRequestSchoolUserWithoutUnitsException();
      }
    }

    const prismaRole = newRole === UserRole.ADMIN ? Role.ADMIN : Role.SCHOOL;
    let googleIdUpdate: string | undefined = undefined;
    if (
      existingUser.googleId.startsWith('pending-') &&
      email !== existingUser.email
    ) {
      googleIdUpdate = `pending-${email}`;
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      if (prismaRole === Role.ADMIN) {
        await tx.userUnit.deleteMany({
          where: { userId: id },
        });
      } else if (prismaRole === Role.SCHOOL && data.unitIds) {
        await tx.userUnit.deleteMany({
          where: { userId: id },
        });
        await tx.userUnit.createMany({
          data: data.unitIds.map((unitId) => ({
            userId: id,
            unitId,
          })),
        });
      }

      return tx.user.update({
        where: { id },
        data: {
          email,
          role: prismaRole,
          ...(googleIdUpdate ? { googleId: googleIdUpdate } : {}),
        },
        include: {
          units: {
            include: {
              unit: {
                include: {
                  school: true,
                },
              },
            },
          },
        },
      });
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      picture: updatedUser.picture,
      role: updatedUser.role as unknown as UserRole,
      createdAt: updatedUser.createdAt.toISOString(),
      units: updatedUser.units.map((uu) => ({
        id: uu.unit.id,
        name: uu.unit.name,
        schoolName: uu.unit.school.name,
      })),
    };
  }

  async deleteUser(
    id: string,
    currentUser: AuthUser,
  ): Promise<{ success: boolean }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existingUser) {
      throw new NotFoundUserException();
    }

    if (existingUser.id === currentUser.id) {
      throw new BadRequestCannotDeleteSelfException();
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}
