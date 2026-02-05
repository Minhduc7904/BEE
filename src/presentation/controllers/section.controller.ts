// src/presentation/controllers/section.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import {
  SectionResponseDto,
  CreateSectionDto,
  UpdateSectionDto,
} from '../../application/dtos/section'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetSectionsByExamUseCase,
  GetSectionByIdUseCase,
  CreateSectionUseCase,
  UpdateSectionUseCase,
  DeleteSectionUseCase,
} from '../../application/use-cases/section'

@Injectable()
@Controller('sections')
export class SectionController {
  constructor(
    private readonly getSectionsByExamUseCase: GetSectionsByExamUseCase,
    private readonly getSectionByIdUseCase: GetSectionByIdUseCase,
    private readonly createSectionUseCase: CreateSectionUseCase,
    private readonly updateSectionUseCase: UpdateSectionUseCase,
    private readonly deleteSectionUseCase: DeleteSectionUseCase,
  ) {}

  /**
   * Get sections by exam ID
   *
   * @route GET /sections?examId=123
   * @param examId - Exam ID (query parameter)
   * @returns List of sections for the exam ordered by 'order' field
   *
   * @example
   * GET /sections?examId=123
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.SECTION_GET_BY_EXAM)
  @HttpCode(HttpStatus.OK)
  async getSectionsByExam(
    @Query('examId', ParseIntPipe) examId: number,
  ): Promise<BaseResponseDto<SectionResponseDto[]>> {
    return ExceptionHandler.execute(() => this.getSectionsByExamUseCase.execute(examId))
  }

  /**
   * Get section by ID
   *
   * @route GET /sections/:id
   * @param id - Section ID
   * @returns Section details
   *
   * @example
   * GET /sections/1
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.SECTION_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSectionById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<SectionResponseDto>> {
    return ExceptionHandler.execute(() => this.getSectionByIdUseCase.execute(id))
  }

  /**
   * Create new section
   *
   * @route POST /sections
   * @param dto - Section data
   * @param adminId - Current admin ID
   * @returns Created section
   *
   * @example
   * POST /sections
   * Body: {
   *   "examId": 123,
   *   "title": "Phần 1: Trắc nghiệm",
   *   "description": "Gồm 20 câu",
   *   "order": 1
   * }
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.SECTION_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @Body() dto: CreateSectionDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<SectionResponseDto>> {
    return ExceptionHandler.execute(() => this.createSectionUseCase.execute(dto, adminId))
  }

  /**
   * Update section
   *
   * @route PUT /sections/:id
   * @param id - Section ID
   * @param dto - Update data
   * @param adminId - Current admin ID
   * @returns Updated section
   *
   * @example
   * PUT /sections/1
   * Body: {
   *   "title": "Phần 1: Trắc nghiệm (Updated)",
   *   "order": 2
   * }
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.SECTION_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<SectionResponseDto>> {
    return ExceptionHandler.execute(() => this.updateSectionUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete section
   *
   * @route DELETE /sections/:id
   * @param id - Section ID
   * @param adminId - Current admin ID
   * @returns Success status
   *
   * @example
   * DELETE /sections/1
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.SECTION_DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteSection(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId?: number,
  ): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.deleteSectionUseCase.execute(id, adminId))
  }
}
