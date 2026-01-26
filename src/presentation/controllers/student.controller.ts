// src/presentation/controllers/student.controller.ts
import { Controller, Get, Query, HttpCode, HttpStatus, Param, Body, Put, Post, Req, ParseIntPipe } from '@nestjs/common'
import { StudentListQueryDto } from 'src/application/dtos/student/student-list-query.dto'
import { StudentListResponseDto, StudentResponseDto, UpdateStudentDto } from 'src/application/dtos/student/student.dto'
import { RegisterStudentDto } from 'src/application/dtos/auth/register.dto'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { AdminOnly, AdminRoles, StudentOnly } from 'src/shared/decorators/permission.decorator'
import {
  GetAllStudentUseCase,
  FetchStudentFromApiUseCase,
  GetProfileStudentUseCase,
  UpdateStudentUseCase,
  CreateStudentUseCase,
} from 'src/application/use-cases'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('students')
export class StudentController {
  constructor(
    private readonly getAllStudentUseCase: GetAllStudentUseCase,
    private readonly fetchStudentFromApiUseCase: FetchStudentFromApiUseCase,
    private readonly getProfileStudentUseCase: GetProfileStudentUseCase,
    private readonly updateStudentUseCase: UpdateStudentUseCase,
    private readonly createStudentUseCase: CreateStudentUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.STUDENT_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllStudents(@Query() query: StudentListQueryDto): Promise<StudentListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllStudentUseCase.execute(query))
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
}
