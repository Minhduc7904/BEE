import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common'

import { AssistantTaskListQueryDto, CreateAssistantTaskDto, UpdateAssistantTaskDto } from '../../application/dtos'
import {
  CreateAssistantTaskUseCase,
  DeleteAssistantTaskUseCase,
  GetAssistantTasksUseCase,
  GetAssistantTaskUseCase,
  UpdateAssistantTaskUseCase,
} from '../../application/use-cases/assistant-task'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('assistant-tasks')
export class AssistantTaskController {
  constructor(
    private readonly listUseCase: GetAssistantTasksUseCase,
    private readonly detailUseCase: GetAssistantTaskUseCase,
    private readonly createUseCase: CreateAssistantTaskUseCase,
    private readonly updateUseCase: UpdateAssistantTaskUseCase,
    private readonly deleteUseCase: DeleteAssistantTaskUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK.GET_ALL)
  list(@Query() query: AssistantTaskListQueryDto) {
    return ExceptionHandler.execute(() => this.listUseCase.execute(query))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK.CREATE)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAssistantTaskDto, @CurrentUser('adminId') actorAdminId: number) {
    return ExceptionHandler.execute(() => this.createUseCase.execute(dto, actorAdminId))
  }

  @Get(':assistantTaskId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK.GET_BY_ID)
  detail(@Param('assistantTaskId', ParseIntPipe) assistantTaskId: number) {
    return ExceptionHandler.execute(() => this.detailUseCase.execute(assistantTaskId))
  }

  @Put(':assistantTaskId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK.UPDATE)
  update(
    @Param('assistantTaskId', ParseIntPipe) assistantTaskId: number,
    @Body() dto: UpdateAssistantTaskDto,
    @CurrentUser('adminId') actorAdminId: number,
  ) {
    return ExceptionHandler.execute(() => this.updateUseCase.execute(assistantTaskId, dto, actorAdminId))
  }

  @Delete(':assistantTaskId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK.DELETE)
  delete(
    @Param('assistantTaskId', ParseIntPipe) assistantTaskId: number,
    @CurrentUser('adminId') actorAdminId: number,
  ) {
    return ExceptionHandler.execute(() => this.deleteUseCase.execute(assistantTaskId, actorAdminId))
  }
}
