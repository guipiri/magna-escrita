import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SchoolsService } from './schools.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { UpdateGradeDto } from './dto/update-grade.dto.js';
import { UpdateClassStudentsDto } from './dto/update-class-students.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';

@Controller()
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('classes')
  @UseGuards(AuthGuard, BackofficeGuard)
  findGrades(@User() user: AuthUser) {
    return this.schoolsService.getClasses(user);
  }

  @Get('schools')
  @UseGuards(AuthGuard, BackofficeGuard)
  getSchools(@User() user: AuthUser) {
    return this.schoolsService.getSchools(user);
  }

  @Get('units')
  @UseGuards(AuthGuard, BackofficeGuard)
  findSchools(@User() user: AuthUser) {
    return this.schoolsService.getSchoolUnits(user);
  }

  @Post('classes')
  @UseGuards(AuthGuard, BackofficeGuard)
  createClass(@Body() body: CreateGradeDto, @User() user: AuthUser) {
    return this.schoolsService.createClass(
      body.name,
      body.students,
      user,
      body.unitId,
    );
  }

  @Patch('classes/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateClass(
    @Param('id') id: string,
    @Body() body: UpdateGradeDto,
    @User() user: AuthUser,
  ) {
    return this.schoolsService.updateClass(id, body.name, user);
  }

  @Delete('classes/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  deleteClass(@Param('id') id: string, @User() user: AuthUser) {
    return this.schoolsService.deleteClass(id, user);
  }

  @Get('classes/:id/students')
  @UseGuards(AuthGuard, BackofficeGuard)
  getClassStudents(@Param('id') id: string, @User() user: AuthUser) {
    return this.schoolsService.getClassStudents(id, user);
  }

  @Put('classes/:id/students')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateClassStudents(
    @Param('id') id: string,
    @Body() body: UpdateClassStudentsDto,
    @User() user: AuthUser,
  ) {
    return this.schoolsService.updateClassStudents(id, body.students, user);
  }
}
