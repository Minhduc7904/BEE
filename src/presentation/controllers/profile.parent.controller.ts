import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import { BaseResponseDto, ParentResponseDto } from '../../application/dtos'
import { GetParentProfileUseCase } from '../../application/use-cases'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('parent/profile')
export class ProfileParentController {
  constructor(private readonly getParentProfileUseCase: GetParentProfileUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<BaseResponseDto<ParentResponseDto>> {
    return ExceptionHandler.execute(() => this.getParentProfileUseCase.execute(user))
  }
}
