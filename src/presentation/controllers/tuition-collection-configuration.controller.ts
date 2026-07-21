import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common'

import {
  BaseResponseDto,
  TuitionCollectionConfigurationResponseDto,
  UpdateTuitionCollectionConfigurationDto,
} from '../../application/dtos'
import {
  GetTuitionCollectionConfigurationUseCase,
  UpdateTuitionCollectionConfigurationUseCase,
} from '../../application/use-cases/tuition-collection-configuration'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/tuition-collection-configuration')
export class TuitionCollectionConfigurationController {
  constructor(
    private readonly getTuitionCollectionConfigurationUseCase: GetTuitionCollectionConfigurationUseCase,
    private readonly updateTuitionCollectionConfigurationUseCase: UpdateTuitionCollectionConfigurationUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.TUITION_COLLECTION_CONFIGURATION.MANAGE)
  @HttpCode(HttpStatus.OK)
  async getConfiguration(): Promise<BaseResponseDto<TuitionCollectionConfigurationResponseDto>> {
    return ExceptionHandler.execute(() => this.getTuitionCollectionConfigurationUseCase.execute())
  }

  @Put()
  @RequirePermission(PERMISSION_CODES.TUITION_COLLECTION_CONFIGURATION.MANAGE)
  @HttpCode(HttpStatus.OK)
  async updateConfiguration(
    @Body() dto: UpdateTuitionCollectionConfigurationDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<TuitionCollectionConfigurationResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.updateTuitionCollectionConfigurationUseCase.execute(dto, adminId),
    )
  }
}
