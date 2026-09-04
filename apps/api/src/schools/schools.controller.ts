import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchoolsService } from './schools.service.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
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

  @Get('schools/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  getSchoolById(@Param('id') id: string, @User() user: AuthUser) {
    return this.schoolsService.getSchoolById(id, user);
  }

  @Post('schools')
  @UseGuards(AuthGuard, BackofficeGuard)
  createSchool(@Body() body: CreateSchoolDto, @User() user: AuthUser) {
    return this.schoolsService.createSchool(body, user);
  }

  @Patch('schools/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  updateSchool(
    @Param('id') id: string,
    @Body() body: UpdateSchoolDto,
    @User() user: AuthUser,
  ) {
    return this.schoolsService.updateSchool(id, body, user);
  }

  @Delete('schools/:id')
  @UseGuards(AuthGuard, BackofficeGuard)
  deleteSchool(@Param('id') id: string, @User() user: AuthUser) {
    return this.schoolsService.deleteSchool(id, user);
  }

  @Get('units')
  @UseGuards(AuthGuard, BackofficeGuard)
  findSchools(@User() user: AuthUser) {
    return this.schoolsService.getSchoolUnits(user);
  }

  @Patch('units/:id/logo')
  @UseGuards(AuthGuard, BackofficeGuard)
  @UseInterceptors(FileInterceptor('logo'))
  uploadUnitLogo(
    @Param('id') id: string,
    @UploadedFile() logo: Express.Multer.File,
    @User() user: AuthUser,
  ) {
    if (!logo) throw new Error('Logo is required');
    return this.schoolsService.uploadUnitLogo(id, logo, user);
  }

  @Get('school-years')
  @UseGuards(AuthGuard, BackofficeGuard)
  findSchoolYears(): SchoolYearOption[] {
    return this.schoolsService.getSchoolYears();
  }

  // Class-related endpoints moved to `classes` module
}
