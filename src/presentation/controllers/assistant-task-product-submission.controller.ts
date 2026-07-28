import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'

import { AssistantTaskProductSubmissionListQueryDto, SubmitAssistantTaskProductDto } from '../../application/dtos'
import {
  GetAssistantTaskProductSubmissionsUseCase,
  GetAssistantTaskProductSubmissionUseCase,
  RemoveAssistantTaskProductUseCase,
  RemoveMyAssistantTaskProductUseCase,
  SubmitAssistantTaskProductUseCase,
  SubmitMyAssistantTaskProductUseCase,
} from '../../application/use-cases/assistant-task'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('assistant-task-product-submissions')
export class AssistantTaskProductSubmissionController {
  constructor(
    private readonly listUseCase: GetAssistantTaskProductSubmissionsUseCase,
    private readonly detailUseCase: GetAssistantTaskProductSubmissionUseCase,
    private readonly submitUseCase: SubmitAssistantTaskProductUseCase,
    private readonly submitMyUseCase: SubmitMyAssistantTaskProductUseCase,
    private readonly removeUseCase: RemoveAssistantTaskProductUseCase,
    private readonly removeMyUseCase: RemoveMyAssistantTaskProductUseCase,
  ) {}

  @Post('manage')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT_SUBMISSION.MANAGE)
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitAssistantTaskProductDto, @CurrentUser('adminId') actorAdminId: number) {
    return ExceptionHandler.execute(() => this.submitUseCase.execute(dto, actorAdminId))
  }

  @Delete('manage/tasks/:assistantTaskId/products/:assistantTaskProductId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT_SUBMISSION.MANAGE)
  remove(
    @Param('assistantTaskId', ParseIntPipe) assistantTaskId: number,
    @Param('assistantTaskProductId', ParseIntPipe)
    assistantTaskProductId: number,
    @CurrentUser('adminId') actorAdminId: number,
  ) {
    return ExceptionHandler.execute(() =>
      this.removeUseCase.execute(assistantTaskId, assistantTaskProductId, actorAdminId),
    )
  }

  @Post('me')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT_SUBMISSION.SELF_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  submitMy(@Body() dto: SubmitAssistantTaskProductDto, @CurrentUser('adminId') assistantId: number) {
    return ExceptionHandler.execute(() => this.submitMyUseCase.execute(dto, assistantId))
  }

  @Delete('me/tasks/:assistantTaskId/products/:assistantTaskProductId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT_SUBMISSION.SELF_MANAGE)
  removeMy(
    @Param('assistantTaskId', ParseIntPipe) assistantTaskId: number,
    @Param('assistantTaskProductId', ParseIntPipe)
    assistantTaskProductId: number,
    @CurrentUser('adminId') assistantId: number,
  ) {
    return ExceptionHandler.execute(() =>
      this.removeMyUseCase.execute(assistantTaskId, assistantTaskProductId, assistantId),
    )
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT_SUBMISSION.GET_ALL)
  list(@Query() query: AssistantTaskProductSubmissionListQueryDto) {
    return ExceptionHandler.execute(() => this.listUseCase.execute(query))
  }

  @Get(':assistantTaskProductSubmissionId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT_SUBMISSION.GET_BY_ID)
  detail(
    @Param('assistantTaskProductSubmissionId', ParseIntPipe)
    assistantTaskProductSubmissionId: number,
  ) {
    return ExceptionHandler.execute(() => this.detailUseCase.execute(assistantTaskProductSubmissionId))
  }
}
