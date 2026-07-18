// src/presentation/controllers/class-student.controller.ts
import { Controller, Get, Post, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe, Res, StreamableFile } from '@nestjs/common'
import { ClassStudentListQueryDto } from '../../application/dtos/class-student/class-student-list-query.dto'
import { CreateClassStudentDto } from '../../application/dtos/class-student/create-class-student.dto'
import { ExportClassStudentListOptionDto } from '../../application/dtos/class-student/export-class-student-list-option.dto'
import {
  ClassStudentListResponseDto,
  ClassStudentResponseDto,
} from '../../application/dtos/class-student/class-student.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllClassStudentUseCase,
    CreateClassStudentUseCase,
    DeleteClassStudentUseCase,
    ExportClassStudentListUseCase,
} from '../../application/use-cases/class-student'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'
import type { Response } from 'express'

@Injectable()
@Controller('class-students')
export class ClassStudentController {
  constructor(
    private readonly getAllClassStudentUseCase: GetAllClassStudentUseCase,
    private readonly createClassStudentUseCase: CreateClassStudentUseCase,
    private readonly deleteClassStudentUseCase: DeleteClassStudentUseCase,
    private readonly exportClassStudentListUseCase: ExportClassStudentListUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.CLASS_STUDENT.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: ClassStudentListQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<ClassStudentListResponseDto> {
    return ExceptionHandler.execute(() => {
      if (!query.studentId) {
        query.studentId = studentId
      }
      return this.getAllClassStudentUseCase.execute(query)
    })
  }

  @Get('student/my')
  @RequirePermission(PERMISSION_CODES.CLASS_STUDENT.GET_MY_CLASSES)
  @HttpCode(HttpStatus.OK)
  async getMyClasses(
    @Query() query: ClassStudentListQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<ClassStudentListResponseDto> {
    query.studentId = studentId
    return ExceptionHandler.execute(() => this.getAllClassStudentUseCase.execute(query))
  }

  /**
   * Export active students of one class as an Excel workbook.
   *
   * Request:
   *   GET /api/class-students/export/excel?classId=12&includeStudentPhone=true
   *
   * Optional query flags:
   * - includeStudentPhone, includeParentPhone, includeSchool,
   *   includeGender, includeDateOfBirth, includeEmail.
   *
   * Response:
   * - HTTP 200, Content-Type:
   *   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   * - Content-Disposition attachment with a filename such as
   *   Danh_sach_hoc_sinh_lop_12_18_07_2026_09_30.xlsx.
   * - The binary response is an .xlsx file with class, course, and student columns.
   */
  @Get('export/excel')
  @RequirePermission(PERMISSION_CODES.CLASS_STUDENT.EXPORT_EXCEL)
  @HttpCode(HttpStatus.OK)
  async exportClassStudentList(
    @Query() options: ExportClassStudentListOptionDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const { buffer, filename } = await this.exportClassStudentListUseCase.execute(options)

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.CLASS_STUDENT.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateClassStudentDto,
    @CurrentUser() user: any,
  ): Promise<BaseResponseDto<ClassStudentResponseDto>> {
    if (user.studentId) {
      dto.studentId = user.studentId
    }
    return ExceptionHandler.execute(() => this.createClassStudentUseCase.execute(dto, user.adminId))
  }

  @Delete(':classId/:studentId')
  @RequirePermission(PERMISSION_CODES.CLASS_STUDENT.DELETE)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteClassStudentUseCase.execute(classId, studentId, adminId))
  }
}
