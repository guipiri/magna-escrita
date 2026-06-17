import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/db.service.js';
import {
  AuthUser,
  UserListResponse,
  UserRole,
} from '@repo/shared';
import { Role } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  BadRequestSchoolUserWithoutUnitsException,
  BadRequestInvalidRoleForUserCreationException,
  ConflictEmailAlreadyExistsException,
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

  async createUser(data: CreateUserDto, currentUser: AuthUser): Promise<UserListResponse> {
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
    if (data.role === UserRole.SCHOOL && (!data.unitIds || data.unitIds.length === 0)) {
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
        units: data.role === UserRole.SCHOOL && data.unitIds
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
}
