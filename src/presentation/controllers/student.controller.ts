// src/presentation/controllers/student.controller.ts
import { Controller, Get, Query, HttpCode, HttpStatus, Param, Body, Put, Req } from '@nestjs/common'
import { Request } from 'express'
import { UnauthorizedException } from 'src/shared/exceptions/custom-exceptions'
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger'
import { StudentListQueryDto } from 'src/application/dtos/student/student-list-query.dto'
import { StudentListResponseDto, StudentResponseDto, UpdateStudentDto } from 'src/application/dtos/student/student.dto'
import { ErrorResponseDto } from 'src/application/dtos/common/error-response.dto'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { AdminRoles, StudentOnly } from 'src/shared/decorators/permission.decorator'
import {
  GetAllStudentUseCase,
  FetchStudentFromApiUseCase,
  GetProfileStudentUseCase,
  UpdateStudentUseCase,
} from 'src/application/use-cases'

@ApiTags('Students')
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
  @ApiOperation({ summary: 'Lấy danh sách học sinh' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách học sinh thành công',
    type: StudentListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
    type: ErrorResponseDto,
  })
  async getAllStudents(@Query() query: StudentListQueryDto): Promise<StudentListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllStudentUseCase.execute(query))
  }

  @Get('fetch-from-api')
  @HttpCode(HttpStatus.OK)
  // @AdminRoles() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
  @ApiOperation({ summary: 'Lấy danh sách học sinh từ API' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách học sinh thành công',
    type: StudentListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
    type: ErrorResponseDto,
  })
  async fetchStudentFromApi(@Query('limit') limit?: number): Promise<{ processed: number; errors: number }> {
    return ExceptionHandler.execute(() => this.fetchStudentFromApiUseCase.execute(limit))
  }

  @Get('profile/me')
  @HttpCode(HttpStatus.OK)
  @StudentOnly()
  @ApiOperation({ summary: 'Lấy thông tin profile của current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin profile thành công',
    type: StudentListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập',
    type: ErrorResponseDto,
  })
  async getCurrentStudentProfile(@Req() req: Request & { user?: any }): Promise<BaseResponseDto<StudentResponseDto>> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return ExceptionHandler.execute(() => this.getProfileStudentUseCase.executeByUserId(userId))
  }

  @Get('profile/:studentId')
  @HttpCode(HttpStatus.OK)
  @StudentOnly()
  @ApiOperation({ summary: 'Lấy thông tin học sinh' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin học sinh thành công',
    type: StudentListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
    type: ErrorResponseDto,
  })
  async getProfileStudent(@Param('studentId') studentId: string): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.getProfileStudentUseCase.execute(studentId))
  }

  @Put('update/:studentId')
  @HttpCode(HttpStatus.OK)
  @StudentOnly()
  @ApiOperation({ summary: 'Cập nhật thông tin học sinh' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thông tin học sinh thành công',
    type: StudentListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
    type: ErrorResponseDto,
  })
  async updateStudent(@Param('studentId') studentId: number, @Body() body: UpdateStudentDto): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateStudentUseCase.execute(studentId, body))
  }
}
