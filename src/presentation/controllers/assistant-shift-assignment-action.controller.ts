import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common'
import type { Response } from 'express'
import {
  ActionApprovalRequestTokenQueryDto,
  CreateAssistantShiftSwapRequestDto,
  CreateAssistantShiftTransferRequestDto,
} from '../../application/dtos'
import {
  AcceptAssistantShiftSwapUseCase,
  AcceptAssistantShiftTransferUseCase,
  DeclineAssistantShiftSwapUseCase,
  DeclineAssistantShiftTransferUseCase,
  RequestAssistantShiftSwapUseCase,
  RequestAssistantShiftTransferUseCase,
} from '../../application/use-cases/assistant-shift'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { renderAssistantShiftAssignmentActionResultPage } from '../../infrastructure/templates/assistant-shift-assignment-action-result.template'

@Controller('assistant-shift-assignment-actions')
export class AssistantShiftAssignmentActionController {
  constructor(
    private readonly requestSwapUseCase: RequestAssistantShiftSwapUseCase,
    private readonly requestTransferUseCase: RequestAssistantShiftTransferUseCase,
    private readonly acceptSwapUseCase: AcceptAssistantShiftSwapUseCase,
    private readonly declineSwapUseCase: DeclineAssistantShiftSwapUseCase,
    private readonly acceptTransferUseCase: AcceptAssistantShiftTransferUseCase,
    private readonly declineTransferUseCase: DeclineAssistantShiftTransferUseCase,
  ) {}

  @Post('my/swap-requests')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.REQUEST_SWAP)
  @HttpCode(HttpStatus.CREATED)
  requestSwap(@CurrentUser('adminId') adminId: number, @Body() dto: CreateAssistantShiftSwapRequestDto) {
    return ExceptionHandler.execute(() => this.requestSwapUseCase.execute(adminId, dto))
  }

  @Post('my/transfer-requests')
  @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.REQUEST_TRANSFER)
  @HttpCode(HttpStatus.CREATED)
  requestTransfer(@CurrentUser('adminId') adminId: number, @Body() dto: CreateAssistantShiftTransferRequestDto) {
    return ExceptionHandler.execute(() => this.requestTransferUseCase.execute(adminId, dto))
  }

  @Get('swap/accept')
  @HttpCode(HttpStatus.OK)
  async acceptSwap(@Query() query: ActionApprovalRequestTokenQueryDto, @Res() response: Response): Promise<void> {
    const result = await this.acceptSwapUseCase.execute(query.token)
    response.type('html').send(renderAssistantShiftAssignmentActionResultPage(result))
  }

  @Get('swap/decline')
  @HttpCode(HttpStatus.OK)
  async declineSwap(@Query() query: ActionApprovalRequestTokenQueryDto, @Res() response: Response): Promise<void> {
    const result = await this.declineSwapUseCase.execute(query.token)
    response.type('html').send(renderAssistantShiftAssignmentActionResultPage(result))
  }

  @Get('transfer/accept')
  @HttpCode(HttpStatus.OK)
  async acceptTransfer(@Query() query: ActionApprovalRequestTokenQueryDto, @Res() response: Response): Promise<void> {
    const result = await this.acceptTransferUseCase.execute(query.token)
    response.type('html').send(renderAssistantShiftAssignmentActionResultPage(result))
  }

  @Get('transfer/decline')
  @HttpCode(HttpStatus.OK)
  async declineTransfer(@Query() query: ActionApprovalRequestTokenQueryDto, @Res() response: Response): Promise<void> {
    const result = await this.declineTransferUseCase.execute(query.token)
    response.type('html').send(renderAssistantShiftAssignmentActionResultPage(result))
  }
}
