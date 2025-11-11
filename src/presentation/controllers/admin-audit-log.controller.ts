import { Controller, Post, Body, HttpCode, HttpStatus, Param, ParseIntPipe } from '@nestjs/common'
import { CreateLogDto, LogResponseDto } from '../../application/dtos/log/log.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RollbackUseCase } from '../../application/use-cases/log/roll-back.use-case'
import { ErrorResponseDto } from '../../application/dtos/common/error-response.dto'
import { ROLE_NAMES } from '../../shared/constants/roles.constant'
import { AnyOf } from '../../shared/decorators/permission.decorator'

@Controller('admin-audit-log')
export class AdminAuditLogController {
  constructor(private readonly rollbackUseCase: RollbackUseCase) {}

  @Post('/rollback/:id')
  @HttpCode(HttpStatus.OK)
            @AnyOf(ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.ADMIN, ROLE_NAMES.ROLLBACK_LOG) // Yêu cầu quyền ADMIN hoặc SUPER_ADMIN
  async rollback(@Param('id', ParseIntPipe) logId: number): Promise<BaseResponseDto<boolean>> {
    return ExceptionHandler.execute(() => this.rollbackUseCase.execute(logId))
  }
}
