// src/presentation/controllers/student.controller.ts
import { Controller, Get, Query, HttpCode, HttpStatus, Param, Body, Put, Req, ParseIntPipe } from '@nestjs/common'
import { StudentListQueryDto } from 'src/application/dtos/student/student-list-query.dto'
import { StudentListResponseDto, StudentResponseDto, UpdateStudentDto } from 'src/application/dtos/student/student.dto'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { AdminOnly, AdminRoles, StudentOnly } from 'src/shared/decorators/permission.decorator'
import {
  GetAllStudentUseCase,
  FetchStudentFromApiUseCase,
  GetProfileStudentUseCase,
  UpdateStudentUseCase,
} from 'src/application/use-cases'
import { CurrentUser } from 'src/shared/decorators'

@Controller('students')
export class StudentController {
  constructor(
    private readonly getAllStudentUseCase: GetAllStudentUseCase,
    private readonly fetchStudentFromApiUseCase: FetchStudentFromApiUseCase,
    private readonly getProfileStudentUseCase: GetProfileStudentUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  @AdminRoles() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
    async getAllStudents(@Query() query: StudentListQueryDto): Promise<StudentListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllStudentUseCase.execute(query))
  }

  @Get('fetch-from-api')
  @HttpCode(HttpStatus.OK)
  @AdminRoles() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
    async fetchStudentFromApi(@Query('limit') limit?: number): Promise<{ processed: number; errors: number }> {
    return ExceptionHandler.execute(() => this.fetchStudentFromApiUseCase.execute(limit))
  }

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
  @AdminOnly()
    async getProfileStudentByAdmin(
    @Param('studentId', ParseIntPipe) studentId: number
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.getProfileStudentUseCase.execute(studentId))
  }


  @Put(':studentId')
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
    async updateStudentByAdmin(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() body: UpdateStudentDto
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStudentUseCase.execute(studentId, body))
  }
}
