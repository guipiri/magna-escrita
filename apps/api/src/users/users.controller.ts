import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
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

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @User() user: AuthUser,
  ): Promise<UserListResponse> {
    return this.usersService.updateUser(id, body, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  deleteUser(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<{ success: boolean }> {
    return this.usersService.deleteUser(id, user);
  }
}
