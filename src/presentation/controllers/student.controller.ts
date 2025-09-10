// src/presentation/controllers/student.controller.ts
import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { StudentListQueryDto } from 'src/application/dtos/student/student-list-query.dto';
import { StudentListResponseDto } from 'src/application/dtos/student/student.dto';
import { ErrorResponseDto } from 'src/application/dtos/common/error-response.dto';
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util';
import { GetAllStudentUseCase } from 'src/application/use-cases/student/get-all-student.use-case';
import { AdminRoles } from 'src/shared/decorators/permission.decorator';
import { FetchStudentFromApiUseCase } from 'src/application/use-cases/student/fetch-student-from-api.use-case';

@ApiTags('Students')
@Controller('students')
export class StudentController {
    constructor(
        private readonly getAllStudentUseCase: GetAllStudentUseCase,
        private readonly fetchStudentFromApiUseCase: FetchStudentFromApiUseCase,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    @AdminRoles() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
    @ApiOperation({ summary: 'Lấy danh sách học sinh' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy danh sách học sinh thành công',
        type: StudentListResponseDto
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Dữ liệu đầu vào không hợp lệ',
        type: ErrorResponseDto
    })
    async getAllStudents(
        @Query() query: StudentListQueryDto
    ): Promise<StudentListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllStudentUseCase.execute(query));
    }

    @Get('fetch-from-api')
    @HttpCode(HttpStatus.OK)
    // @AdminRoles() // Sử dụng decorator mới - chỉ ADMIN, SUPER_ADMIN tự động có quyền
    @ApiOperation({ summary: 'Lấy danh sách học sinh từ API' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy danh sách học sinh thành công',
        type: StudentListResponseDto
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Dữ liệu đầu vào không hợp lệ',
        type: ErrorResponseDto
    })
    async fetchStudentFromApi(
        @Query('limit') limit?: number
    ): Promise<{ processed: number; errors: number }> {
        return ExceptionHandler.execute(() => this.fetchStudentFromApiUseCase.execute(limit));
    }
}




