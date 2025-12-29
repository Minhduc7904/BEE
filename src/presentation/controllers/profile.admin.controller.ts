import { Controller, Get, Put, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { BaseResponseDto, AdminResponseDto, UpdateAdminDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { GetAdminProfileUseCase, UpdateAdminProfileUseCase } from '../../application/use-cases'

@Controller('admin/profile')
export class ProfileAdminController {
  constructor(
    private readonly getAdminProfileUseCase: GetAdminProfileUseCase,
    private readonly updateAdminProfileUseCase: UpdateAdminProfileUseCase,
  ) {}

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
}
