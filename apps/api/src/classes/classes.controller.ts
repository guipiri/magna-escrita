import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';
import { CreateClassDto } from './dto/create-class.dto.js';
import { ClassesService } from './classes.service.js';
import { UpdateClassDto } from './dto/update-class.dto.js';
import { UpdateClassStudentsDto } from './dto/update-class-students.dto.js';

@Controller()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get('classes')
  @UseGuards(AuthGuard, BackofficeGuard)
  findClasses(@User() user: AuthUser) {
    return this.classesService.getClasses(user);
  }

  @Post('classes')
  @UseGuards(AuthGuard, BackofficeGuard)
  createClass(@Body() body: CreateClassDto, @User() user: AuthUser) {
    return this.classesService.createClass(
      body.name,
      body.students,
      body.teacherName,
      user,
      body.bookTemplateId,
      body.unitId,
    );
  }

  @Patch('classes/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateClass(
    @Param('id') id: string,
    @Body() body: UpdateClassDto,
    @User() user: AuthUser,
  ) {
    return this.classesService.updateClass(id, body, user);
  }

  @Delete('classes/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  deleteClass(@Param('id') id: string, @User() user: AuthUser) {
    return this.classesService.deleteClass(id, user);
  }

  @Get('classes/:id/students')
  @UseGuards(AuthGuard, BackofficeGuard)
  getClassStudents(@Param('id') id: string, @User() user: AuthUser) {
    return this.classesService.getClassStudents(id, user);
  }

  @Put('classes/:id/students')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateClassStudents(
    @Param('id') id: string,
    @Body() body: UpdateClassStudentsDto,
    @User() user: AuthUser,
  ) {
    return this.classesService.updateClassStudents(id, body.students, user);
  }
}
