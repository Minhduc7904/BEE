import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { RetentionCleanupService } from 'src/application/use-cases/background-job'

@Injectable()
export class RetentionCleanupScheduler {
  private readonly logger = new Logger(RetentionCleanupScheduler.name)

  constructor(private readonly retentionCleanupService: RetentionCleanupService) {}

  @Cron('0 0 3 * * *', {
    name: 'audit-log-retention-cleanup',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async cleanAuditLogs(): Promise<void> {
    try {
      const result = await this.retentionCleanupService.executeAuditLogCleanup('SCHEDULER:AUDIT_LOG_RETENTION_CLEANUP')
      if (!result) {
        this.logger.debug('Bỏ qua dọn audit log vì job đang tắt')
        return
      }
      this.logger.log(`Dọn audit log thành công: xóa ${result.deletedCount} bản ghi, job #${result.backgroundJobRunId}`)
    } catch (error) {
      this.logError('Dọn audit log theo lịch thất bại', error)
    }
  }

  @Cron('0 10 3 * * *', {
    name: 'background-job-run-retention-cleanup',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async cleanBackgroundJobRuns(): Promise<void> {
    try {
      const result = await this.retentionCleanupService.executeBackgroundJobRunCleanup(
        'SCHEDULER:BACKGROUND_JOB_RUN_RETENTION_CLEANUP',
      )
      if (!result) {
        this.logger.debug('Bỏ qua dọn lịch sử chạy job vì job đang tắt')
        return
      }
      this.logger.log(
        `Dọn lịch sử chạy job thành công: xóa ${result.deletedCount} bản ghi, job #${result.backgroundJobRunId}`,
      )
    } catch (error) {
      this.logError('Dọn lịch sử chạy job theo lịch thất bại', error)
    }
  }

  @Cron('0 20 3 * * *', {
    name: 'user-refresh-token-cleanup',
    timeZone: 'Asia/Ho_Chi_Minh',
    waitForCompletion: true,
  })
  async cleanUserRefreshTokens(): Promise<void> {
    try {
      const result = await this.retentionCleanupService.executeUserRefreshTokenCleanup(
        'SCHEDULER:USER_REFRESH_TOKEN_CLEANUP',
      )
      if (!result) {
        this.logger.debug('Bỏ qua dọn refresh token vì job đang tắt')
        return
      }
      this.logger.log(
        `Dọn refresh token thành công: xóa ${result.deletedCount} bản ghi trong ${result.batchCount} batch, job #${result.backgroundJobRunId}, còn dữ liệu=${result.hasMore}`,
      )
    } catch (error) {
      this.logError('Dọn refresh token theo lịch thất bại', error)
    }
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof ConflictException && error.message === 'RETENTION_CLEANUP_ALREADY_RUNNING') {
      this.logger.debug(`${message}: worker khác đang chạy`)
      return
    }
    this.logger.error(message, error instanceof Error ? error.stack : undefined)
  }
}
