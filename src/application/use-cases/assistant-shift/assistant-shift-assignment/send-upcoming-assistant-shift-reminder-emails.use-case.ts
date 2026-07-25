import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { AssistantShiftReminderCandidate } from '../../../../domain/interface/assistant-shift'
import type { BackgroundJobRunResultSummary } from '../../../../domain/interface/background-job'
import type { IUnitOfWork } from '../../../../domain/repositories'
import {
  AssistantShiftAssignmentAttendanceStatus,
  BackgroundJobCode,
  BackgroundJobRunStatus,
} from '../../../../shared/enums'
import { ConflictException } from '../../../../shared/exceptions/custom-exceptions'
import { AssistantShiftReminderEmailServicePort } from '../../../interfaces'

const ASSISTANT_SHIFT_REMINDER_JOB = {
  code: BackgroundJobCode.ASSISTANT_SHIFT_REMINDER,
  displayName: 'Nhắc lịch và xác nhận vắng trợ giảng',
  cronExpression: '0 */5 * * * *',
  timezone: 'Asia/Ho_Chi_Minh',
  isEnabled: true,
  maxRuntimeSeconds: 240,
} as const

export interface AssistantShiftReminderJobResult {
  backgroundJobRunId: number
  checkInEmailsSent: number
  absenceEmailsSent: number
  assignmentsMarkedAbsent: number
  failedEmailCount: number
  emailFailures: AssistantShiftReminderEmailFailure[]
}

export interface AssistantShiftReminderEmailFailure extends BackgroundJobRunResultSummary {
  type: 'CHECK_IN_REMINDER' | 'ABSENCE_NOTIFICATION'
  assistantShiftId: number
  adminId: number
  recipientEmail: string
  occurredAt: string
  errorMessage: string
  errorCode: string | null
  httpStatus: number | null
}

@Injectable()
export class SendUpcomingAssistantShiftReminderEmailsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    private readonly reminderEmailService: AssistantShiftReminderEmailServicePort,
  ) {}

  async executeScheduled(workerId: string): Promise<AssistantShiftReminderJobResult | null> {
    const job = await this.uow.executeInTransaction((repos) =>
      repos.backgroundJobRepository.upsert(ASSISTANT_SHIFT_REMINDER_JOB),
    )
    if (!job.canRun()) return null

    const execution = await this.acquireExecution(job.backgroundJobId, job.maxRuntimeSeconds, workerId)
    if (!execution) throw new ConflictException('ASSISTANT_SHIFT_REMINDER_ALREADY_RUNNING')

    try {
      const result = await this.processAssignments()
      await this.completeExecution(execution.backgroundJobRunId, result)
      return { backgroundJobRunId: execution.backgroundJobRunId, ...result }
    } catch (error) {
      await this.failExecution(execution.backgroundJobRunId, error)
      throw error
    } finally {
      await this.uow.executeInTransaction((repos) =>
        repos.backgroundJobLockRepository.release(execution.backgroundJobId, execution.lockToken),
      )
    }
  }

  private async acquireExecution(backgroundJobId: number, maxRuntimeSeconds: number, workerId: string) {
    return this.uow.executeInTransaction(async (repos) => {
      const now = new Date()
      const lockToken = randomUUID()
      const lock = await repos.backgroundJobLockRepository.tryAcquire({
        backgroundJobId,
        lockToken,
        workerId,
        lockedAt: now,
        leaseExpiresAt: new Date(now.getTime() + maxRuntimeSeconds * 1000),
      })
      if (!lock) return null

      const latestRun = await repos.backgroundJobRunRepository.findLatestByBackgroundJobId(backgroundJobId)
      const scheduledAt = new Date(now)
      scheduledAt.setMilliseconds(0)
      if (latestRun && latestRun.scheduledAt >= scheduledAt) {
        scheduledAt.setTime(latestRun.scheduledAt.getTime() + 1000)
      }

      const run = await repos.backgroundJobRunRepository.create({
        backgroundJobId,
        scheduledAt,
        startedAt: now,
        status: BackgroundJobRunStatus.RUNNING,
        workerId,
        lockToken,
        leaseExpiresAt: lock.leaseExpiresAt,
      })
      return {
        backgroundJobId,
        backgroundJobRunId: run.backgroundJobRunId,
        lockToken,
      }
    })
  }

  private async processAssignments(): Promise<Omit<AssistantShiftReminderJobResult, 'backgroundJobRunId'>> {
    const now = new Date()
    const [checkInCandidates, absenceCandidates] = await Promise.all([
      this.uow.executeInTransaction((repos) =>
        repos.assistantShiftAssignmentRepository.findCheckInReminderCandidates(now),
      ),
      this.uow.executeInTransaction((repos) =>
        repos.assistantShiftAssignmentRepository.findExpiredAbsenceCandidates(now),
      ),
    ])

    let checkInEmailsSent = 0
    let absenceEmailsSent = 0
    let assignmentsMarkedAbsent = 0
    let failedEmailCount = 0
    const emailFailures: AssistantShiftReminderEmailFailure[] = []

    for (const candidate of checkInCandidates) {
      if (!candidate.token || !candidate.recipientEmail) continue
      const claimed = await this.uow.executeInTransaction((repos) =>
        repos.assistantShiftAssignmentRepository.claimCheckInReminderEmail(
          candidate.assistantShiftId,
          candidate.adminId,
          now,
        ),
      )
      if (!claimed) continue

      try {
        await this.reminderEmailService.sendReminder({
          assistantShiftId: candidate.assistantShiftId,
          token: candidate.token,
          recipientEmail: candidate.recipientEmail,
          recipientName: candidate.recipientName,
          shiftName: candidate.assistantShiftName,
          shiftNotes: candidate.shiftNotes,
          startAt: candidate.startAt,
          endAt: candidate.endAt,
        })
        checkInEmailsSent += 1
      } catch (error) {
        failedEmailCount += 1
        emailFailures.push(this.createEmailFailure('CHECK_IN_REMINDER', candidate, error))
        await this.uow.executeInTransaction((repos) =>
          repos.assistantShiftAssignmentRepository.requeueCheckInReminderEmail(
            candidate.assistantShiftId,
            candidate.adminId,
          ),
        )
      }
    }

    for (const candidate of absenceCandidates) {
      const markedPendingAsAbsent = candidate.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PENDING
      const claimed = await this.uow.executeInTransaction((repos) =>
        repos.assistantShiftAssignmentRepository.claimAbsenceNotification(
          candidate.assistantShiftId,
          candidate.adminId,
          candidate.attendanceStatus,
          now,
        ),
      )
      if (!claimed) continue
      if (markedPendingAsAbsent) assignmentsMarkedAbsent += 1
      if (!candidate.recipientEmail) continue

      try {
        await this.reminderEmailService.sendAbsenceNotification({
          recipientEmail: candidate.recipientEmail,
          recipientName: candidate.recipientName,
          shiftName: candidate.assistantShiftName,
          startAt: candidate.startAt,
          endAt: candidate.endAt,
        })
        absenceEmailsSent += 1
      } catch (error) {
        failedEmailCount += 1
        emailFailures.push(this.createEmailFailure('ABSENCE_NOTIFICATION', candidate, error))
        await this.uow.executeInTransaction((repos) =>
          repos.assistantShiftAssignmentRepository.requeueAbsenceNotification(
            candidate.assistantShiftId,
            candidate.adminId,
          ),
        )
      }
    }

    return {
      checkInEmailsSent,
      absenceEmailsSent,
      assignmentsMarkedAbsent,
      failedEmailCount,
      emailFailures,
    }
  }

  private createEmailFailure(
    type: AssistantShiftReminderEmailFailure['type'],
    candidate: AssistantShiftReminderCandidate,
    error: unknown,
  ): AssistantShiftReminderEmailFailure {
    const errorRecord = error && typeof error === 'object' ? (error as Record<string, unknown>) : {}
    const response =
      errorRecord.response && typeof errorRecord.response === 'object'
        ? (errorRecord.response as Record<string, unknown>)
        : {}
    const status = errorRecord.statusCode ?? errorRecord.status ?? response.status
    const errorCode = errorRecord.code ?? response.code
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      type,
      assistantShiftId: candidate.assistantShiftId,
      adminId: candidate.adminId,
      recipientEmail: this.maskEmail(candidate.recipientEmail ?? ''),
      occurredAt: new Date().toISOString(),
      errorMessage: errorMessage.slice(0, 1000),
      errorCode: typeof errorCode === 'string' ? errorCode.slice(0, 100) : null,
      httpStatus: typeof status === 'number' ? status : null,
    }
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    if (!domain) return '***'
    return `${localPart.slice(0, 1) || '*'}***@${domain}`
  }

  private async completeExecution(
    backgroundJobRunId: number,
    result: Omit<AssistantShiftReminderJobResult, 'backgroundJobRunId'>,
  ): Promise<void> {
    await this.uow.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.SUCCEEDED,
        finishedAt: new Date(),
        resultSummary: result,
      }),
    )
  }

  private async failExecution(backgroundJobRunId: number, error: unknown): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.message.slice(0, 1000) : 'Lỗi không xác định khi nhắc lịch trợ giảng'

    await this.uow.executeInTransaction((repos) =>
      repos.backgroundJobRunRepository.update(backgroundJobRunId, {
        status: BackgroundJobRunStatus.FAILED,
        finishedAt: new Date(),
        errorCode: 'ASSISTANT_SHIFT_REMINDER_FAILED',
        errorMessage,
      }),
    )
  }
}
