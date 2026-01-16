// src/presentation/controllers/class-student.controller.ts
import { Controller, Get, Post, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { ClassStudentListQueryDto } from '../../application/dtos/class-student/class-student-list-query.dto'
import { CreateClassStudentDto } from '../../application/dtos/class-student/create-class-student.dto'
import {
  ClassStudentListResponseDto,
  ClassStudentResponseDto,
} from '../../application/dtos/class-student/class-student.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import {
  GetAllClassStudentUseCase,
  CreateClassStudentUseCase,
  DeleteClassStudentUseCase,
} from '../../application/use-cases/class-student'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'

@Injectable()
@Controller('class-students')
export class ClassStudentController {
  constructor(
    private readonly getAllClassStudentUseCase: GetAllClassStudentUseCase,
    private readonly createClassStudentUseCase: CreateClassStudentUseCase,
    private readonly deleteClassStudentUseCase: DeleteClassStudentUseCase,
  ) {}

  @Get()
  @RequirePermission('classStudent.getAll')
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

  @Post()
  @RequirePermission('classStudent.create')
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
  @RequirePermission('classStudent.delete')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteClassStudentUseCase.execute(classId, studentId, adminId))
  }
}
