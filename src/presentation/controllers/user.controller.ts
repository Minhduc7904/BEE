// src/presentation/controllers/user.controller.ts
import {
  Controller,
  Patch,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { Request } from 'express'
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case'
import { UpdateUserAvatarUseCase } from '../../application/use-cases/user/update-user-avatar.use-case'
import { UpdateStudentUseCase } from '../../application/use-cases/student/update-student.use-case'
import { UpdateAdminUseCase } from '../../application/use-cases/admin/update-admin.use-case'
import { UserResponseDto, UpdateUserDto } from '../../application/dtos/user/user.dto'
import { UpdateAvatarResponseDto } from '../../application/dtos/user/update-avatar.dto'
import { StudentResponseDto, UpdateStudentDto } from '../../application/dtos/student/student.dto'
import { AdminResponseDto, UpdateAdminDto } from '../../application/dtos/admin/admin.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { FileValidationUtil } from '../../shared/utils/file-validation.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'

@ApiTags('User Management')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly updateUserAvatarUseCase: UpdateUserAvatarUseCase,
    private readonly updateAdminUseCase: UpdateAdminUseCase,
  ) { }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({
    summary: 'Upload và cập nhật avatar cho user',
    description: 'Upload ảnh avatar mới và cập nhật thông tin avatar cho user hiện tại'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload avatar thành công',
    type: BaseResponseDto<UpdateAvatarResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'File không hợp lệ hoặc quá lớn',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User không tồn tại',
    type: ErrorResponseDto,
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user?: any }
  ): Promise<BaseResponseDto<UpdateAvatarResponseDto>> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('User ID not found in token');
    }
    console.log(file)
    if (!file) {
      throw new Error('File is required');
    }

    // Manual file validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPG, PNG, GIF, WEBP are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 5MB allowed');
    }

    return ExceptionHandler.execute(() =>
      this.updateUserAvatarUseCase.execute(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      )
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin user',
    description: 'Cập nhật thông tin cơ bản của user (username, email, firstName, lastName)',
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
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateUserDto): Promise<UserResponseDto> {
    return await this.updateUserUseCase.execute(id, updateDto)
  }

  @Patch(':id/admin')
  @ApiOperation({
    summary: 'Cập nhật thông tin admin',
    description: 'Cập nhật thông tin admin bao gồm cả thông tin user cơ bản',
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
    @Body() updateDto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    return await this.updateAdminUseCase.execute(adminId, updateDto)
  }
}
