import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SchoolsService } from './schools.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';
import type { SchoolYearOption } from '@repo/shared';
import { UpdateClassDto } from './dto/update-grade.dto.js';

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

  @Post('schools')
  @UseGuards(AuthGuard, BackofficeGuard)
  createSchool(@Body() body: CreateSchoolDto, @User() user: AuthUser) {
    return this.schoolsService.createSchool(body, user);
  }

  @Get('units')
  @UseGuards(AuthGuard, BackofficeGuard)
  findSchools(@User() user: AuthUser) {
    return this.schoolsService.getSchoolUnits(user);
  }

  @Get('school-years')
  @UseGuards(AuthGuard, BackofficeGuard)
  findSchoolYears(): SchoolYearOption[] {
    return this.schoolsService.getSchoolYears();
  }

  @Post('classes')
  @UseGuards(AuthGuard, BackofficeGuard)
  createClass(@Body() body: CreateGradeDto, @User() user: AuthUser) {
    return this.schoolsService.createClass(
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
    return this.schoolsService.updateClass(id, body, user);
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
}
