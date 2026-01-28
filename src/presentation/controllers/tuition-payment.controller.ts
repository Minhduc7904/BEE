import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Injectable,
} from '@nestjs/common'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

import {
  CreateTuitionPaymentDto,
  UpdateTuitionPaymentDto,
  TuitionPaymentListQueryDto,
  TuitionPaymentStatsQueryDto,
  MyTuitionPaymentStatsQueryDto,
  CreateBulkTuitionPaymentDto,
} from '../../application/dtos/tuition-payment'

import {
  TuitionPaymentListResponseDto,
  TuitionPaymentResponseDto,
  TuitionPaymentStatsResponseDto,
} from '../../application/dtos/tuition-payment'

import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'

import {
  GetTuitionPaymentsUseCase,
  GetTuitionPaymentByIdUseCase,
  CreateTuitionPaymentUseCase,
  UpdateTuitionPaymentUseCase,
  DeleteTuitionPaymentUseCase,
  GetTuitionPaymentStatsByStatusUseCase,
  GetMyTuitionPaymentStatsByStatusUseCase,
  CreateBulkTuitionPaymentUseCase,
} from '../../application/use-cases/tuition-payment'

@Injectable()
@Controller('tuition-payments')
export class TuitionPaymentController {
  constructor(
    private readonly getTuitionPaymentsUseCase: GetTuitionPaymentsUseCase,
    private readonly getTuitionPaymentByIdUseCase: GetTuitionPaymentByIdUseCase,
    private readonly createTuitionPaymentUseCase: CreateTuitionPaymentUseCase,
    private readonly createBulkTuitionPaymentUseCase: CreateBulkTuitionPaymentUseCase,
    private readonly updateTuitionPaymentUseCase: UpdateTuitionPaymentUseCase,
    private readonly deleteTuitionPaymentUseCase: DeleteTuitionPaymentUseCase,

    // stats
    private readonly getTuitionPaymentStatsByStatusUseCase: GetTuitionPaymentStatsByStatusUseCase,
    private readonly getMyTuitionPaymentStatsByStatusUseCase: GetMyTuitionPaymentStatsByStatusUseCase,
  ) {}

  // ======================================================
  // 📊 STATS
  // ======================================================

  /**
   * GET /tuition-payments/stats/status
   * ADMIN: thống kê học phí theo status
   */
  @Get('stats/status')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_STATS)
  @HttpCode(HttpStatus.OK)
  async statsByStatusAdmin(
    @Query() query: TuitionPaymentStatsQueryDto,
  ): Promise<BaseResponseDto<TuitionPaymentStatsResponseDto>> {
    return ExceptionHandler.execute(() => this.getTuitionPaymentStatsByStatusUseCase.execute(query))
  }

  /**
   * GET /tuition-payments/my/stats/status
   * STUDENT: thống kê học phí của chính mình
   */
  @Get('my/stats/status')
  @RequirePermission(PERMISSION_CODES.MY_TUITION_PAYMENT_STATS)
  @HttpCode(HttpStatus.OK)
  async statsByStatusMy(
    @Query() query: MyTuitionPaymentStatsQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<TuitionPaymentStatsResponseDto>> {
    return ExceptionHandler.execute(() => this.getMyTuitionPaymentStatsByStatusUseCase.execute(query, studentId))
  }

  // ======================================================
  // LIST
  // ======================================================

  /**
   * GET /tuition-payments
   * ADMIN: list + filter + pagination
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAll(@Query() query: TuitionPaymentListQueryDto): Promise<TuitionPaymentListResponseDto> {
    return ExceptionHandler.execute(() => this.getTuitionPaymentsUseCase.execute(query))
  }

  /**
   * GET /tuition-payments/course/:courseId
   */
  @Get('course/:courseId')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_GET_BY_COURSE)
  @HttpCode(HttpStatus.OK)
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: TuitionPaymentListQueryDto,
  ): Promise<TuitionPaymentListResponseDto> {
    query.courseId = courseId
    return ExceptionHandler.execute(() => this.getTuitionPaymentsUseCase.execute(query))
  }

  /**
   * GET /tuition-payments/student/:studentId
   */
  @Get('student/:studentId')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_GET_BY_STUDENT)
  @HttpCode(HttpStatus.OK)
  async getByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: TuitionPaymentListQueryDto,
  ): Promise<TuitionPaymentListResponseDto> {
    query.studentId = studentId
    return ExceptionHandler.execute(() => this.getTuitionPaymentsUseCase.execute(query))
  }

  /**
   * GET /tuition-payments/my
   * STUDENT: list học phí của chính mình
   */
  @Get('my')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_GET_MY)
  @HttpCode(HttpStatus.OK)
  async getMy(
    @Query() query: TuitionPaymentListQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<TuitionPaymentListResponseDto> {
    query.studentId = studentId
    return ExceptionHandler.execute(() => this.getTuitionPaymentsUseCase.execute(query))
  }

  // ======================================================
  // GET BY ID
  // ======================================================

  /**
   * GET /tuition-payments/:id
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    return ExceptionHandler.execute(() => this.getTuitionPaymentByIdUseCase.execute(id))
  }

  // ======================================================
  // CRUD (ADMIN)
  // ======================================================

  @Post()
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTuitionPaymentDto, @CurrentUser('adminId') adminId: number): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    return ExceptionHandler.execute(() => this.createTuitionPaymentUseCase.execute(dto, adminId))
  }

  @Post('bulk')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_CREATE_BULK)
  @HttpCode(HttpStatus.CREATED)
  async createBulk(
    @Body() dto: CreateBulkTuitionPaymentDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto[]>> {
    return ExceptionHandler.execute(() => this.createBulkTuitionPaymentUseCase.execute(dto, adminId))
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_UPDATE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTuitionPaymentDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    return ExceptionHandler.execute(() => this.updateTuitionPaymentUseCase.execute(dto, id, adminId))
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.TUITION_PAYMENT_DELETE)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.deleteTuitionPaymentUseCase.execute(id, adminId))
  }
}
