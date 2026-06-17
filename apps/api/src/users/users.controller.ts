import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser, UserListResponse } from '@repo/shared';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  getUsers(@User() user: AuthUser): Promise<UserListResponse[]> {
    return this.usersService.getUsers(user);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  createUser(
    @Body() body: CreateUserDto,
    @User() user: AuthUser,
  ): Promise<UserListResponse> {
    return this.usersService.createUser(body, user);
  }
}
