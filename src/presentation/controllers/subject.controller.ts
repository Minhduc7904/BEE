import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectResponseDto,
  SubjectDetailResponseDto,
  BaseResponseDto,
  SubjectListQueryDto,
  PaginationResponseDto,
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import {
  CreateSubjectUseCase,
  GetSubjectUseCase,
  GetAllSubjectsUseCase,
  UpdateSubjectUseCase,
  DeleteSubjectUseCase,
} from '../../application/use-cases/subject'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('subjects')
export class SubjectController {
  constructor(
    private readonly createSubjectUseCase: CreateSubjectUseCase,
    private readonly getSubjectUseCase: GetSubjectUseCase,
    private readonly getAllSubjectsUseCase: GetAllSubjectsUseCase,
    private readonly updateSubjectUseCase: UpdateSubjectUseCase,
    private readonly deleteSubjectUseCase: DeleteSubjectUseCase,
  ) {}

  /**
   * Create a new subject
   * POST /subjects
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.SUBJECT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<SubjectResponseDto>> {
    return ExceptionHandler.execute(() => this.createSubjectUseCase.execute(dto, adminId))
  }

  /**
   * Get all subjects with pagination and filtering
   * GET /subjects
   * Query params:
   * - page: số trang (mặc định: 1)
   * - limit: số lượng mỗi trang (mặc định: 10, max: 100)
   * - search: tìm kiếm theo name, code
   * - code: filter theo mã môn học
   * - sortBy: trường sắp xếp (name, code)
   * - sortOrder: thứ tự sắp xếp (asc, desc)
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.SUBJECT_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllSubjects(
    @Query() query: SubjectListQueryDto,
  ): Promise<PaginationResponseDto<SubjectResponseDto>> {
    return ExceptionHandler.execute(() => this.getAllSubjectsUseCase.execute(query))
  }

  /**
   * Get subject by ID
   * GET /subjects/:id
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.SUBJECT_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSubject(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<SubjectResponseDto>> {
    return ExceptionHandler.execute(() => this.getSubjectUseCase.execute(id))
  }

  /**
   * Update subject
   * PUT /subjects/:id
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.SUBJECT_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<SubjectResponseDto>> {
    return ExceptionHandler.execute(() => this.updateSubjectUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete subject
   * DELETE /subjects/:id
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.SUBJECT_DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteSubject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.deleteSubjectUseCase.execute(id, adminId))
  }
}
