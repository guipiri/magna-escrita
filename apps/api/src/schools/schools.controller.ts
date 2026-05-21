import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { BackofficeGuard } from '../auth/guards/backoffice.guard.js';
import { User } from '../auth/auth.decorator.js';
import type { AuthUser } from '@repo/shared';
import type { SchoolYearOption } from '@repo/shared';

@Controller()
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

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

  // Class-related endpoints moved to `classes` module
}
