import { Controller, Post, Get, Body, HttpCode, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { PaginationResponseDto } from '../../application/dtos/pagination/pagination-response.dto'
import { LogResponseDto } from '../../application/dtos/log/log.dto'
import { AuditLogListQueryDto } from '../../application/dtos/log/audit-log-list-query.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import {
  RollbackUseCase,
  GetAuditLogUseCase,
  GetAllAuditLogsUseCase,
} from '../../application/use-cases/log'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { Injectable } from '@nestjs/common'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Injectable()
@Controller('admin-audit-log')
export class AdminAuditLogController {
  constructor(
    private readonly rollbackUseCase: RollbackUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
    private readonly getAllAuditLogsUseCase: GetAllAuditLogsUseCase,
  ) { }

  /**
   * Get all audit logs with pagination
   * GET /admin-audit-log
   * Query params:
   * - page: số trang (default: 1)
   * - limit: số lượng mỗi trang (default: 10, max: 100)
   * - search: tìm kiếm theo actionKey, resourceType, resourceId
   * - adminId: filter theo admin ID
   * - actionKey: filter theo action key
   * - resourceType: filter theo resource type
   * - resourceId: filter theo resource ID
   * - status: filter theo status (SUCCESS, FAIL, ROLLBACK)
   * - fromDate: ngày bắt đầu (ISO 8601)
   * - toDate: ngày kết thúc (ISO 8601)
   * - sortBy: trường sắp xếp (default: createdAt)
   * - sortOrder: asc hoặc desc (default: desc)
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.AUDIT_LOG_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllAuditLogs(@Query() query: AuditLogListQueryDto): Promise<PaginationResponseDto<LogResponseDto>> {
    return ExceptionHandler.execute(() => this.getAllAuditLogsUseCase.execute(query))
  }

  @Get('admin/:adminId')
  @RequirePermission(PERMISSION_CODES.AUDIT_LOG_GET_ALL_BY_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllAuditLogsByAdmin(
    @Param('adminId', ParseIntPipe) adminId: number,
    @Query() query: AuditLogListQueryDto
  ): Promise<PaginationResponseDto<LogResponseDto>> {
    query.adminId = adminId
    return ExceptionHandler.execute(() => this.getAllAuditLogsUseCase.execute(query))
  }

  /**
   * Get audit log by ID
   * GET /admin-audit-log/:id
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.AUDIT_LOG_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getAuditLog(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<LogResponseDto>> {
    return ExceptionHandler.execute(() => this.getAuditLogUseCase.execute(id))
  }

  /**
   * Rollback a specific audit log
   * POST /admin-audit-log/rollback/:id
   */
  @Post('rollback/:id')
  @RequirePermission(PERMISSION_CODES.AUDIT_LOG_ROLLBACK)
  @HttpCode(HttpStatus.OK)
  async rollback(@Param('id', ParseIntPipe) logId: number): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.rollbackUseCase.execute(logId))
  }
}

