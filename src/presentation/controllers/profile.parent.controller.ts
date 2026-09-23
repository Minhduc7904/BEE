import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import { BaseResponseDto, ParentResponseDto, ParentStudentSummaryDto } from '../../application/dtos'
import {
  GetAvailableParentStudentsUseCase,
  GetParentProfileUseCase,
  LinkParentStudentUseCase,
} from '../../application/use-cases'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('parent/profile')
export class ProfileParentController {
  constructor(
    private readonly getParentProfileUseCase: GetParentProfileUseCase,
    private readonly getAvailableParentStudentsUseCase: GetAvailableParentStudentsUseCase,
    private readonly linkParentStudentUseCase: LinkParentStudentUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<BaseResponseDto<ParentResponseDto>> {
    return ExceptionHandler.execute(() => this.getParentProfileUseCase.execute(user))
  }

  @Get('available-students')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getAvailableStudents(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ParentStudentSummaryDto[]>> {
    return ExceptionHandler.execute(() => this.getAvailableParentStudentsUseCase.execute(user))
  }

  @Post('students/:studentId')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async linkStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<ParentStudentSummaryDto>> {
    return ExceptionHandler.execute(() => this.linkParentStudentUseCase.execute(user, studentId))
  }
}
