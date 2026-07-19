import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CreateReportDto } from 'src/application/dtos/report/create-report.dto'
import { MyReportListQueryDto, ReportListQueryDto } from 'src/application/dtos/report/report-list-query.dto'
import { ReportListResponseDto, ReportResponseDto } from 'src/application/dtos/report/report-response.dto'
import { UpdateReportDto } from 'src/application/dtos/report/update-report.dto'
import {
  CreateReportUseCase,
  DeleteReportUseCase,
  GetMyReportsUseCase,
  GetReportByIdUseCase,
  GetReportsUseCase,
  UpdateReportUseCase,
} from 'src/application/use-cases/report'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('reports')
export class ReportController {
  constructor(
    private readonly createReportUseCase: CreateReportUseCase,
    private readonly getReportsUseCase: GetReportsUseCase,
    private readonly getMyReportsUseCase: GetMyReportsUseCase,
    private readonly getReportByIdUseCase: GetReportByIdUseCase,
    private readonly updateReportUseCase: UpdateReportUseCase,
    private readonly deleteReportUseCase: DeleteReportUseCase,
  ) {}

  /** Student creates a report. Reporter identity is always derived from the access token. */
  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser('userId') userId?: number,
  ): Promise<BaseResponseDto<ReportResponseDto>> {
    return ExceptionHandler.execute(() => this.createReportUseCase.execute(dto, userId))
  }

  @Get('me')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  getMyReports(
    @Query() query: MyReportListQueryDto,
    @CurrentUser('userId') userId: number,
  ): Promise<ReportListResponseDto> {
    return ExceptionHandler.execute(() => this.getMyReportsUseCase.execute(userId, query))
  }

  @Get('me/:id')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  getMyReportDetail(
    @Param('id', ParseIntPipe) reportId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<ReportResponseDto>> {
    return ExceptionHandler.execute(() => this.getReportByIdUseCase.executeForReporter(reportId, userId))
  }

  @Get('admin')
  @RequirePermission(PERMISSION_CODES.REPORT.GET_ALL)
  @HttpCode(HttpStatus.OK)
  getAllForAdmin(@Query() query: ReportListQueryDto): Promise<ReportListResponseDto> {
    return ExceptionHandler.execute(() => this.getReportsUseCase.execute(query))
  }

  @Get('admin/:id')
  @RequirePermission(PERMISSION_CODES.REPORT.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  getDetailForAdmin(
    @Param('id', ParseIntPipe) reportId: number,
  ): Promise<BaseResponseDto<ReportResponseDto>> {
    return ExceptionHandler.execute(() => this.getReportByIdUseCase.execute(reportId))
  }

  @Patch('admin/:id')
  @RequirePermission(PERMISSION_CODES.REPORT.UPDATE)
  @HttpCode(HttpStatus.OK)
  updateForAdmin(
    @Param('id', ParseIntPipe) reportId: number,
    @Body() dto: UpdateReportDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ReportResponseDto>> {
    return ExceptionHandler.execute(() => this.updateReportUseCase.execute(reportId, dto, adminId))
  }

  @Delete('admin/:id')
  @RequirePermission(PERMISSION_CODES.REPORT.DELETE)
  @HttpCode(HttpStatus.OK)
  deleteForAdmin(
    @Param('id', ParseIntPipe) reportId: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteReportUseCase.execute(reportId))
  }
}
