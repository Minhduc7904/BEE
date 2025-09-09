// src/presentation/controllers/user.controller.ts
import { Controller, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case';
import { UpdateStudentUseCase } from '../../application/use-cases/student/update-student.use-case';
import { UpdateAdminUseCase } from '../../application/use-cases/admin/update-admin.use-case';
import { UserResponseDto, UpdateUserDto } from '../../application/dtos/user/user.dto';
import { StudentResponseDto, UpdateStudentDto } from '../../application/dtos/student/student.dto';
import { AdminResponseDto, UpdateAdminDto } from '../../application/dtos/admin/admin.dto';

@ApiTags('User Management')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
    constructor(
        private readonly updateUserUseCase: UpdateUserUseCase,
        private readonly updateStudentUseCase: UpdateStudentUseCase,
        private readonly updateAdminUseCase: UpdateAdminUseCase,
    ) {}

    @Patch(':id')
    @ApiOperation({ 
        summary: 'Cập nhật thông tin user',
        description: 'Cập nhật thông tin cơ bản của user (username, email, firstName, lastName)' 
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật user thành công',
        type: UserResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'User không tồn tại',
    })
    @ApiResponse({
        status: 409,
        description: 'Username hoặc email đã tồn tại',
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu không hợp lệ hoặc lỗi business logic',
    })
    async updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateUserDto
    ): Promise<UserResponseDto> {
        return await this.updateUserUseCase.execute(id, updateDto);
    }

    @Patch(':id/student')
    @ApiOperation({ 
        summary: 'Cập nhật thông tin student',
        description: 'Cập nhật thông tin student bao gồm cả thông tin user cơ bản' 
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật student thành công',
        type: StudentResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Student không tồn tại',
    })
    @ApiResponse({
        status: 409,
        description: 'Username hoặc email đã tồn tại',
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu không hợp lệ hoặc lỗi business logic',
    })
    async updateStudent(
        @Param('id', ParseIntPipe) studentId: number,
        @Body() updateDto: UpdateStudentDto
    ): Promise<StudentResponseDto> {
        return await this.updateStudentUseCase.execute(studentId, updateDto);
    }

    @Patch(':id/admin')
    @ApiOperation({ 
        summary: 'Cập nhật thông tin admin',
        description: 'Cập nhật thông tin admin bao gồm cả thông tin user cơ bản' 
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật admin thành công',
        type: AdminResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Admin không tồn tại',
    })
    @ApiResponse({
        status: 409,
        description: 'Username hoặc email đã tồn tại',
    })
    @ApiResponse({
        status: 400,
        description: 'Dữ liệu không hợp lệ hoặc lỗi business logic',
    })
    async updateAdmin(
        @Param('id', ParseIntPipe) adminId: number,
        @Body() updateDto: UpdateAdminDto
    ): Promise<AdminResponseDto> {
        return await this.updateAdminUseCase.execute(adminId, updateDto);
    }
}
