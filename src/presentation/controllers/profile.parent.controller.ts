import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  BaseResponseDto,
  ParentResponseDto,
  ParentStudentSummaryDto,
  StudentResponseDto,
  UpdateParentDto,
} from '../../application/dtos'
import {
  GetAvailableParentStudentsUseCase,
  GetParentProfileUseCase,
  GetParentStudentDetailUseCase,
  LinkParentStudentUseCase,
  UnlinkParentStudentUseCase,
  UpdateParentProfileUseCase,
} from '../../application/use-cases'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('parent/profile')
export class ProfileParentController {
  constructor(
    private readonly getParentProfileUseCase: GetParentProfileUseCase,
    private readonly getAvailableParentStudentsUseCase: GetAvailableParentStudentsUseCase,
    private readonly linkParentStudentUseCase: LinkParentStudentUseCase,
    private readonly updateParentProfileUseCase: UpdateParentProfileUseCase,
    private readonly getParentStudentDetailUseCase: GetParentStudentDetailUseCase,
    private readonly unlinkParentStudentUseCase: UnlinkParentStudentUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<BaseResponseDto<ParentResponseDto>> {
    return ExceptionHandler.execute(() => this.getParentProfileUseCase.execute(user))
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateParentDto,
  ): Promise<BaseResponseDto<ParentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateParentProfileUseCase.execute(userId, dto))
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

  @Get('students/:studentId')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async getStudentDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<StudentResponseDto>> {
    return ExceptionHandler.execute(() => this.getParentStudentDetailUseCase.execute(user, studentId))
  }

  @Delete('students/:studentId')
  @HttpCode(HttpStatus.OK)
  @AuthOnly()
  async unlinkStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<{ unlinked: boolean }>> {
    return ExceptionHandler.execute(() => this.unlinkParentStudentUseCase.execute(user, studentId))
  }
}
