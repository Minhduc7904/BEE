import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common'
import { CreateAssistantShiftAssignmentDto, UpdateAssistantShiftAssignmentDto } from '../../application/dtos'
import { CreateAssistantShiftAssignmentUseCase, DeleteAssistantShiftAssignmentUseCase, UpdateAssistantShiftAssignmentUseCase } from '../../application/use-cases/assistant-shift'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('assistant-shifts/:shiftId/assignments')
export class AssistantShiftAssignmentController {
  constructor(private readonly createUseCase: CreateAssistantShiftAssignmentUseCase, private readonly updateUseCase: UpdateAssistantShiftAssignmentUseCase, private readonly deleteUseCase: DeleteAssistantShiftAssignmentUseCase) {}
  @Post() @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.ASSIGN) @HttpCode(HttpStatus.CREATED) create(@Param('shiftId', ParseIntPipe) shiftId: number, @Body() dto: CreateAssistantShiftAssignmentDto) { return ExceptionHandler.execute(() => this.createUseCase.execute(shiftId, dto)) }
  @Put(':adminId') @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.UPDATE_ASSIGNMENT) update(@Param('shiftId', ParseIntPipe) shiftId: number, @Param('adminId', ParseIntPipe) adminId: number, @Body() dto: UpdateAssistantShiftAssignmentDto) { return ExceptionHandler.execute(() => this.updateUseCase.execute(shiftId, adminId, dto)) }
  @Delete(':adminId') @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.DELETE_ASSIGNMENT) @HttpCode(HttpStatus.OK) delete(@Param('shiftId', ParseIntPipe) shiftId: number, @Param('adminId', ParseIntPipe) adminId: number) { return ExceptionHandler.execute(() => this.deleteUseCase.execute(shiftId, adminId)) }
}
