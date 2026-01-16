// src/presentation/controllers/course-enrollment.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import { CourseEnrollmentListQueryDto } from '../../application/dtos/course-enrollment/course-enrollment-list-query.dto'
import { CreateCourseEnrollmentDto } from '../../application/dtos/course-enrollment/create-course-enrollment.dto'
import { UpdateCourseEnrollmentDto } from '../../application/dtos/course-enrollment/update-course-enrollment.dto'
import {
  CourseEnrollmentListResponseDto,
  CourseEnrollmentResponseDto,
} from '../../application/dtos/course-enrollment/course-enrollment.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
  GetAllCourseEnrollmentUseCase,
  GetCourseEnrollmentByIdUseCase,
  CreateCourseEnrollmentUseCase,
  UpdateCourseEnrollmentUseCase,
  DeleteCourseEnrollmentUseCase,
} from '../../application/use-cases/course-enrollment'

import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { CourseEnrollmentStatus } from 'src/shared/enums'

@Injectable()
@Controller('course-enrollments')
export class CourseEnrollmentController {
  constructor(
    private readonly getAllCourseEnrollmentUseCase: GetAllCourseEnrollmentUseCase,
    private readonly getCourseEnrollmentByIdUseCase: GetCourseEnrollmentByIdUseCase,
    private readonly createCourseEnrollmentUseCase: CreateCourseEnrollmentUseCase,
    private readonly updateCourseEnrollmentUseCase: UpdateCourseEnrollmentUseCase,
    private readonly deleteCourseEnrollmentUseCase: DeleteCourseEnrollmentUseCase,
  ) {}

  @Get()
  @RequirePermission('courseEnrollment.getAll')
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: CourseEnrollmentListQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<CourseEnrollmentListResponseDto> {
    return ExceptionHandler.execute(() => {
      if (!query.studentId) {
        query.studentId = studentId
      }
      return this.getAllCourseEnrollmentUseCase.execute(query)
    })
  }

  @Get(':id')
  @RequirePermission('courseEnrollment.getById')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    return ExceptionHandler.execute(() => this.getCourseEnrollmentByIdUseCase.execute(id))
  }

  @Post()
  @RequirePermission('courseEnrollment.create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCourseEnrollmentDto,
    @CurrentUser() user: any,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    return ExceptionHandler.execute(() => {
      const isStudent = user.userType === 'STUDENT'
      if (isStudent && user.studentId) {
        dto.studentId = user.studentId
      }
      return this.createCourseEnrollmentUseCase.execute(dto, isStudent, adminId)
    })
  }

  @Put(':id')
  @RequirePermission('courseEnrollment.update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseEnrollmentDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateCourseEnrollmentUseCase.execute(id, dto, adminId))
  }

  @Delete(':id')
  @RequirePermission('courseEnrollment.delete')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteCourseEnrollmentUseCase.execute(id, adminId))
  }
}
