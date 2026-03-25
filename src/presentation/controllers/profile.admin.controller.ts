import { Controller, Get, Put, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { BaseResponseDto, AdminResponseDto, UpdateAdminDto } from '../../application/dtos'
import { MediaResponseDto } from '../../application/dtos/media'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { GetAdminProfileUseCase, UpdateAdminProfileUseCase, UploadAdminAvatarUseCase } from '../../application/use-cases'

@Controller('admin/profile')
export class ProfileAdminController {
  constructor(
    private readonly getAdminProfileUseCase: GetAdminProfileUseCase,
    private readonly updateAdminProfileUseCase: UpdateAdminProfileUseCase,
    private readonly uploadAdminAvatarUseCase: UploadAdminAvatarUseCase,
  ) { }

  /**
   * Get admin profile
   * GET /admin/profile
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getProfile(@CurrentUser('userId') userId: number): Promise<BaseResponseDto<AdminResponseDto>> {
    return ExceptionHandler.execute(() => this.getAdminProfileUseCase.execute(userId))
  }

  /**
   * Update admin profile
   * PUT /admin/profile
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() updateDto: UpdateAdminDto,
  ): Promise<BaseResponseDto<AdminResponseDto>> {
    return ExceptionHandler.execute(() => this.updateAdminProfileUseCase.execute(userId, updateDto))
  }

  /**
   * Upload admin avatar
   * POST /admin/profile/avatar
   */
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.uploadAdminAvatarUseCase.execute(file, userId))
  }
}
