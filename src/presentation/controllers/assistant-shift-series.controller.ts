import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common'
import { CreateAssistantShiftSeriesDto, UpdateAssistantShiftSeriesDto } from '../../application/dtos'
import { CreateAssistantShiftSeriesUseCase, DeleteAssistantShiftSeriesUseCase, GetAllAssistantShiftSeriesUseCase, GetAvailableAssistantShiftSeriesUseCase, UpdateAssistantShiftSeriesUseCase } from '../../application/use-cases/assistant-shift'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('assistant-shift-series')
export class AssistantShiftSeriesController {
  constructor(private readonly available: GetAvailableAssistantShiftSeriesUseCase, private readonly all: GetAllAssistantShiftSeriesUseCase, private readonly createUseCase: CreateAssistantShiftSeriesUseCase, private readonly updateUseCase: UpdateAssistantShiftSeriesUseCase, private readonly deleteUseCase: DeleteAssistantShiftSeriesUseCase) { }
  @Get('available') @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.GET_AVAILABLE_SERIES) @HttpCode(HttpStatus.OK) availableList() { return ExceptionHandler.execute(() => this.available.execute()) }
  @Get() @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.GET_ALL_SERIES) @HttpCode(HttpStatus.OK) allList() { return ExceptionHandler.execute(() => this.all.execute()) }
  @Post() @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.CREATE_SERIES) @HttpCode(HttpStatus.CREATED) create(@Body() dto: CreateAssistantShiftSeriesDto) { return ExceptionHandler.execute(() => this.createUseCase.execute(dto)) }
  @Put(':id') @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.UPDATE_SERIES) @HttpCode(HttpStatus.OK) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAssistantShiftSeriesDto) { return ExceptionHandler.execute(() => this.updateUseCase.execute(id, dto)) }
  @Delete(':id') @RequirePermission(PERMISSION_CODES.ASSISTANT_SHIFT.DELETE_SERIES) @HttpCode(HttpStatus.OK) delete(@Param('id', ParseIntPipe) id: number) { return ExceptionHandler.execute(() => this.deleteUseCase.execute(id)) }
}
