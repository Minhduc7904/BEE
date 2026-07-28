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

import {
  AssistantTaskProductListQueryDto,
  CreateAssistantTaskProductDto,
  CreateMyAssistantTaskProductDto,
  UpdateAssistantTaskProductDto,
  UpdateMyAssistantTaskProductDto,
} from '../../application/dtos'
import {
  CreateAssistantTaskProductUseCase,
  CreateMyAssistantTaskProductUseCase,
  DeleteAssistantTaskProductUseCase,
  GetAssistantTaskProductsUseCase,
  GetAssistantTaskProductUseCase,
  UpdateAssistantTaskProductUseCase,
  UpdateMyAssistantTaskProductUseCase,
} from '../../application/use-cases/assistant-task'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('assistant-task-products')
export class AssistantTaskProductController {
  constructor(
    private readonly listUseCase: GetAssistantTaskProductsUseCase,
    private readonly detailUseCase: GetAssistantTaskProductUseCase,
    private readonly createUseCase: CreateAssistantTaskProductUseCase,
    private readonly createMyUseCase: CreateMyAssistantTaskProductUseCase,
    private readonly updateUseCase: UpdateAssistantTaskProductUseCase,
    private readonly updateMyUseCase: UpdateMyAssistantTaskProductUseCase,
    private readonly deleteUseCase: DeleteAssistantTaskProductUseCase,
  ) {}

  @Get('me')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.GET_MY)
  listMy(@CurrentUser('adminId') assistantId: number, @Query() query: AssistantTaskProductListQueryDto) {
    return ExceptionHandler.execute(() => this.listUseCase.execute(query, assistantId))
  }

  @Post('me')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.CREATE_MY)
  @HttpCode(HttpStatus.CREATED)
  createMy(@CurrentUser('adminId') assistantId: number, @Body() dto: CreateMyAssistantTaskProductDto) {
    return ExceptionHandler.execute(() => this.createMyUseCase.execute(dto, assistantId))
  }

  @Put('me/:assistantTaskProductId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.UPDATE_MY)
  updateMy(
    @Param('assistantTaskProductId', ParseIntPipe)
    assistantTaskProductId: number,
    @Body() dto: UpdateMyAssistantTaskProductDto,
    @CurrentUser('adminId') assistantId: number,
  ) {
    return ExceptionHandler.execute(() => this.updateMyUseCase.execute(assistantTaskProductId, dto, assistantId))
  }

  @Post('assistants/:assistantId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.CREATE_FOR_ASSISTANT)
  @HttpCode(HttpStatus.CREATED)
  createForAssistant(
    @Param('assistantId', ParseIntPipe) assistantId: number,
    @Body() dto: CreateAssistantTaskProductDto,
    @CurrentUser('adminId') actorAdminId: number,
  ) {
    return ExceptionHandler.execute(() => this.createUseCase.execute(assistantId, dto, actorAdminId))
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.GET_ALL)
  list(@Query() query: AssistantTaskProductListQueryDto) {
    return ExceptionHandler.execute(() => this.listUseCase.execute(query))
  }

  @Get(':assistantTaskProductId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.GET_BY_ID)
  detail(
    @Param('assistantTaskProductId', ParseIntPipe)
    assistantTaskProductId: number,
  ) {
    return ExceptionHandler.execute(() => this.detailUseCase.execute(assistantTaskProductId))
  }

  @Put(':assistantTaskProductId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.UPDATE)
  update(
    @Param('assistantTaskProductId', ParseIntPipe)
    assistantTaskProductId: number,
    @Body() dto: UpdateAssistantTaskProductDto,
    @CurrentUser('adminId') actorAdminId: number,
  ) {
    return ExceptionHandler.execute(() => this.updateUseCase.execute(assistantTaskProductId, dto, actorAdminId))
  }

  @Delete(':assistantTaskProductId')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_TASK_PRODUCT.DELETE)
  delete(
    @Param('assistantTaskProductId', ParseIntPipe)
    assistantTaskProductId: number,
    @CurrentUser('adminId') actorAdminId: number,
  ) {
    return ExceptionHandler.execute(() => this.deleteUseCase.execute(assistantTaskProductId, actorAdminId))
  }
}
