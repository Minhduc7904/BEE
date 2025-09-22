// src/presentation/controllers/user.controller.ts
import {
  Controller,
  Patch,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes
} from '@nestjs/swagger'
import {
  UpdateAdminUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserUseCase
} from '../../application/use-cases'
import {
  UpdateAvatarResponseDto,
  UserResponseDto,
  UpdateUserDto,
  AdminResponseDto,
  UpdateAdminDto,
  BaseResponseDto,
  ErrorResponseDto
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from 'src/shared/decorators'
import { ValidatedImageFile } from '../../shared/decorators'

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
  async uploadAvatar(
    @ValidatedImageFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<UpdateAvatarResponseDto>> {
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
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateUserDto): Promise<UserResponseDto> {
    return await this.updateUserUseCase.execute(id, updateDto)
  }

  @Patch(':id/admin')
  @ApiOperation({
    summary: 'Cập nhật thông tin admin',
    description: 'Cập nhật thông tin admin bao gồm cả thông tin user cơ bản',
  })
  async updateAdmin(
    @Param('id', ParseIntPipe) adminId: number,
    @Body() updateDto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    return await this.updateAdminUseCase.execute(adminId, updateDto)
  }
}
