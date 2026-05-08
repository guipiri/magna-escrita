import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';

@Controller()
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('grades')
  @UseGuards(AuthGuard, BackofficeGuard)
  findGrades(@User() user: AuthUser) {
    return this.schoolsService.getGrades(user);
  }

  @Get('units')
  @UseGuards(AuthGuard, BackofficeGuard)
  findSchools(@User() user: AuthUser) {
    return this.schoolsService.getSchoolUnits(user);
  }

  @Post('grades')
  @UseGuards(AuthGuard, BackofficeGuard)
  createGrade(@Body() body: CreateGradeDto, @User() user: AuthUser) {
    return this.schoolsService.createGrade(
      body.name,
      body.students,
      user,
      body.unitId,
    );
  }
}
