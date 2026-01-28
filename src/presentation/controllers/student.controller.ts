// src/presentation/controllers/student.controller.ts
import { Controller, Get, Query, HttpCode, HttpStatus, Param, Body, Put, Post, Req, ParseIntPipe, StreamableFile, Res } from '@nestjs/common'
import { StudentListQueryDto } from 'src/application/dtos/student/student-list-query.dto'
import {
  StudentListResponseDto,
  StudentResponseDto,
  UpdateStudentDto
} from 'src/application/dtos/student/student.dto'
import {
  StudentGradeStatsListResponseDto,
  StudentStatsResponseDto
} from 'src/application/dtos/student/student-stats-response.dto'
import { RegisterStudentDto } from 'src/application/dtos/auth/register.dto'
import { ExportStudentListOptionDto } from 'src/application/dtos/student/export-student-list-option.dto'

import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { AdminOnly, AdminRoles, StudentOnly } from 'src/shared/decorators/permission.decorator'
import {
  GetAllStudentUseCase,
  FetchStudentFromApiUseCase,
  GetProfileStudentUseCase,
  UpdateStudentUseCase,
  CreateStudentUseCase,
  GetStudentStatsByStatusUseCase,
  GetStudentStatsByGradeUseCase,
  ExportStudentListUseCase,
} from 'src/application/use-cases'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import type { Response } from 'express'

@Controller('students')
export class StudentController {
  constructor(
    private readonly getAllStudentUseCase: GetAllStudentUseCase,
    private readonly fetchStudentFromApiUseCase: FetchStudentFromApiUseCase,
    private readonly getProfileStudentUseCase: GetProfileStudentUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly createStudentUseCase: CreateStudentUseCase,
    private readonly getStudentStatsByStatusUseCase: GetStudentStatsByStatusUseCase,
    private readonly getStudentStatsByGradeUseCase: GetStudentStatsByGradeUseCase,
    private readonly exportStudentListUseCase: ExportStudentListUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.STUDENT_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllStudents(@Query() query: StudentListQueryDto): Promise<StudentListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllStudentUseCase.execute(query))
  }

  @Get('stats/status')
  @RequirePermission(PERMISSION_CODES.STUDENT_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getStudentStatusStatics(@Query() query: StudentListQueryDto): Promise<BaseResponseDto<StudentStatsResponseDto>> {
    return ExceptionHandler.execute(() => this.getStudentStatsByStatusUseCase.execute(query))
  }

  @Get('stats/grade')
  @RequirePermission(PERMISSION_CODES.STUDENT_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getStudentGradeStatics(@Query() query: StudentListQueryDto): Promise<BaseResponseDto<StudentGradeStatsListResponseDto>> {
    return ExceptionHandler.execute(() => this.getStudentStatsByGradeUseCase.execute(query))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.STUDENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createStudent(
    @Body() dto: RegisterStudentDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.createStudentUseCase.execute(dto, adminId))
  }

  // @Get('fetch-from-api')
  // @HttpCode(HttpStatus.OK)
  // @RequirePermission('student.fetchFromApi')
  // async fetchStudentFromApi(@Query('limit') limit?: number): Promise<{ processed: number; errors: number }> {
  //   return ExceptionHandler.execute(() => this.fetchStudentFromApiUseCase.execute(limit))
  // }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @StudentOnly()
  async getCurrentStudentProfile(
    @CurrentUser('studentId') studentId: number
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.getProfileStudentUseCase.execute(studentId))
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @StudentOnly()
  async updateStudent(
    @Body() body: UpdateStudentDto,
    @CurrentUser('studentId') studentId: number
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStudentUseCase.execute(studentId, body))
  }

  @Get(':studentId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.STUDENT_GET_BY_ID)
  async getProfileStudentByAdmin(
    @Param('studentId', ParseIntPipe) studentId: number
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.getProfileStudentUseCase.execute(studentId))
  }


  @Put(':studentId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSION_CODES.STUDENT_UPDATE)
  async updateStudentByAdmin(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() body: UpdateStudentDto
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStudentUseCase.execute(studentId, body))
  }

  @Get('export/excel')
  @RequirePermission(PERMISSION_CODES.STUDENT_EXPORT_EXCEL)
  @HttpCode(HttpStatus.OK)
  async exportStudentList(
    @Query() options: ExportStudentListOptionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      console.log('Export options:', options);
      const { buffer, filename } = await this.exportStudentListUseCase.execute(options)

      // Set response headers for file download
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }
}
