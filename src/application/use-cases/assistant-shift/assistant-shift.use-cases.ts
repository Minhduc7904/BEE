import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AssistantShiftAllBySeriesQueryDto, AssistantShiftAssistantStatisticsResponseDto, AssistantShiftAssignmentResponseDto, AssistantShiftDateRangeQueryDto, AssistantShiftRangeDto, AssistantShiftResponseDto, AssistantShiftSeriesResponseDto, BaseResponseDto, CopyAssistantShiftsDto, CreateAssistantShiftAssignmentDto, CreateAssistantShiftDto, CreateAssistantShiftSeriesDto, SetAssistantShiftSelfRegistrationWindowDto, UpdateAssistantShiftAssignmentDto, UpdateAssistantShiftDto, UpdateAssistantShiftSeriesDto } from '../../dtos'
import type { IAdminRepository, IMediaUsageRepository, IUnitOfWork } from '../../../domain/repositories'
import { AssistantShiftAssignmentAttendanceStatus, BackgroundJobCode, BackgroundJobRunStatus, MediaStatus } from '../../../shared/enums'
import { AssistantShiftReminderEmailServicePort, MinioService } from '../../interfaces'
import type { AssistantShiftReminderCandidate } from '../../../domain/interface/assistant-shift'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../shared/constants'
import { ASSISTANT_SHIFT_CONFIG } from '../../../shared/constants/assistant-shift.constants'
import { BusinessLogicException, ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

const details = { includeSeries: true, includeAssignmentsWithAdmin: true, includeCourseClass: true }
const AVATAR_URL_EXPIRY_SECONDS = 3600 * 24

async function assertEligibleAssistant(
  adminId: number,
  adminRepository: IAdminRepository,
) {
  const admin = await adminRepository.findById(adminId)
  if (!admin) throw new NotFoundException('Trợ giảng không tồn tại')
  if (!admin.user?.hasRole(ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID)) {
    throw new BusinessLogicException('Chỉ admin có role trợ giảng mới có thể đăng ký hoặc được phân công ca')
  }
  return admin
}

async function attachAssistantAvatarUrls(
  shifts: AssistantShiftResponseDto[],
  mediaUsageRepository: IMediaUsageRepository,
  minioService: MinioService,
): Promise<void> {
  const assignments = shifts.flatMap((shift) => shift.assignments ?? [])
  const userIds = [...new Set(assignments.map((assignment) => assignment.admin?.userId).filter((id): id is number => id !== undefined))]
  if (userIds.length === 0) return

  const usages = await mediaUsageRepository.findByEntities(EntityType.USER, userIds, USER_MEDIA_FIELDS.AVATAR)
  const avatarMediaByUserId = new Map<number, (typeof usages)[number]['media']>()
  for (const usage of usages) {
    const media = usage.media
    if (media && media.status === MediaStatus.READY && !avatarMediaByUserId.has(usage.entityId)) avatarMediaByUserId.set(usage.entityId, media)
  }

  const avatarUrlByUserId = new Map<number, string>()
  await Promise.all([...avatarMediaByUserId].map(async ([userId, media]) => {
    if (!media) return
    try { avatarUrlByUserId.set(userId, await minioService.getPresignedUrl(media.bucketName, media.objectKey, AVATAR_URL_EXPIRY_SECONDS)) } catch { /* Avatar is optional. */ }
  }))
  for (const assignment of assignments) if (assignment.admin) assignment.admin.avatarUrl = avatarUrlByUserId.get(assignment.admin.userId)
}
function assertRange(startAt: Date, endAt: Date) { if (endAt <= startAt) throw new BusinessLogicException('Thời gian kết thúc phải sau thời gian bắt đầu') }

@Injectable() export class GetAvailableAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute() { const data = await this.uow.executeInTransaction((r) => r.assistantShiftSeriesRepository.findAll({ isLocked: false })); return BaseResponseDto.success('Lấy danh sách chuỗi ca thành công', data.map((x) => new AssistantShiftSeriesResponseDto(x))) } }
@Injectable() export class GetAllAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute() { const data = await this.uow.executeInTransaction((r) => r.assistantShiftSeriesRepository.findAll()); return BaseResponseDto.success('Lấy tất cả chuỗi ca thành công', data.map((x) => new AssistantShiftSeriesResponseDto(x))) } }

abstract class AssistantShiftListBase { constructor(protected readonly uow: IUnitOfWork, protected readonly mediaUsageRepository: IMediaUsageRepository, protected readonly minioService: MinioService) {} protected async list(seriesId: number, query: AssistantShiftDateRangeQueryDto, onlyUnlocked: boolean, assignedAdminId?: number) { const range = query.toRange(); if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ'); const data = await this.uow.executeInTransaction(async (r) => { const series = await r.assistantShiftSeriesRepository.findById(seriesId); if (!series) throw new NotFoundException('Chuỗi ca không tồn tại'); if (onlyUnlocked && series.isLocked) return []; return r.assistantShiftRepository.findAll({ assistantShiftSeriesId: seriesId, ...range, onlyUnlocked, assignedAdminId, ...details }) }); const response = data.map((x) => new AssistantShiftResponseDto(x)); await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService); return BaseResponseDto.success('Lấy danh sách ca thành công', response) } }
@Injectable() export class GetAvailableAssistantShiftsBySeriesUseCase extends AssistantShiftListBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number, query: AssistantShiftDateRangeQueryDto) { return this.list(id, query, true) } }
@Injectable() export class GetAllAssistantShiftsBySeriesUseCase extends AssistantShiftListBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number, query: AssistantShiftAllBySeriesQueryDto) { return this.list(id, query, false, query.adminId) } }

abstract class AssistantShiftDetailBase { constructor(protected readonly uow: IUnitOfWork, protected readonly mediaUsageRepository: IMediaUsageRepository, protected readonly minioService: MinioService) {} protected async get(id: number, onlyUnlocked: boolean) { const shift = await this.uow.executeInTransaction((r) => r.assistantShiftRepository.findById(id, details)); if (!shift) throw new NotFoundException('Ca trợ giảng không tồn tại'); if (onlyUnlocked && (shift.isLocked || shift.series?.isLocked)) throw new NotFoundException('Ca trợ giảng không tồn tại'); const response = new AssistantShiftResponseDto(shift); await attachAssistantAvatarUrls([response], this.mediaUsageRepository, this.minioService); return BaseResponseDto.success('Lấy chi tiết ca thành công', response) } }
@Injectable() export class GetAvailableAssistantShiftUseCase extends AssistantShiftDetailBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number) { return this.get(id, true) } }
@Injectable() export class GetAssistantShiftUseCase extends AssistantShiftDetailBase { constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork, @Inject('IMediaUsageRepository') mediaUsageRepository: IMediaUsageRepository, minioService: MinioService) { super(uow, mediaUsageRepository, minioService) } execute(id: number) { return this.get(id, false) } }

@Injectable() export class CreateAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(dto: CreateAssistantShiftSeriesDto) { const item = await this.uow.executeInTransaction((r) => r.assistantShiftSeriesRepository.create(dto)); return BaseResponseDto.success('Tạo chuỗi ca thành công', new AssistantShiftSeriesResponseDto(item)) } }
@Injectable() export class UpdateAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number, dto: UpdateAssistantShiftSeriesDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftSeriesRepository.findById(id)) throw new NotFoundException('Chuỗi ca không tồn tại'); return r.assistantShiftSeriesRepository.update(id, dto) }); return BaseResponseDto.success('Cập nhật chuỗi ca thành công', new AssistantShiftSeriesResponseDto(item)) } }
@Injectable() export class DeleteAssistantShiftSeriesUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number) { await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftSeriesRepository.findById(id)) throw new NotFoundException('Chuỗi ca không tồn tại'); await r.assistantShiftSeriesRepository.delete(id) }); return BaseResponseDto.success('Xóa chuỗi ca thành công', { deleted: true }) } }

@Injectable() export class CreateAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(dto: CreateAssistantShiftDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftSeriesRepository.findById(dto.assistantShiftSeriesId)) throw new NotFoundException('Chuỗi ca không tồn tại'); const startAt = new Date(dto.startAt), endAt = new Date(dto.endAt); assertRange(startAt, endAt); return r.assistantShiftRepository.create({ ...dto, startAt, endAt, selfRegistrationOpenAt: dto.selfRegistrationOpenAt ? new Date(dto.selfRegistrationOpenAt) : null, selfRegistrationCloseAt: dto.selfRegistrationCloseAt ? new Date(dto.selfRegistrationCloseAt) : null }) }); return BaseResponseDto.success('Tạo ca thành công', new AssistantShiftResponseDto(item)) } }
@Injectable() export class UpdateAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number, dto: UpdateAssistantShiftDto) { const item = await this.uow.executeInTransaction(async (r) => { const current = await r.assistantShiftRepository.findById(id); if (!current) throw new NotFoundException('Ca trợ giảng không tồn tại'); if (dto.assistantShiftSeriesId && !await r.assistantShiftSeriesRepository.findById(dto.assistantShiftSeriesId)) throw new NotFoundException('Chuỗi ca không tồn tại'); const startAt = dto.startAt ? new Date(dto.startAt) : current.startAt, endAt = dto.endAt ? new Date(dto.endAt) : current.endAt; assertRange(startAt, endAt); return r.assistantShiftRepository.update(id, { ...dto, startAt, endAt, selfRegistrationOpenAt: dto.selfRegistrationOpenAt ? new Date(dto.selfRegistrationOpenAt) : undefined, selfRegistrationCloseAt: dto.selfRegistrationCloseAt ? new Date(dto.selfRegistrationCloseAt) : undefined }) }); return BaseResponseDto.success('Cập nhật ca thành công', new AssistantShiftResponseDto(item)) } }
@Injectable() export class DeleteAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(id: number) { await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftRepository.findById(id)) throw new NotFoundException('Ca trợ giảng không tồn tại'); await r.assistantShiftRepository.delete(id) }); return BaseResponseDto.success('Xóa ca thành công', { deleted: true }) } }

@Injectable() export class RegisterAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { const item = await this.uow.executeInTransaction(async (r) => { await assertEligibleAssistant(adminId, r.adminRepository); const shift = await r.assistantShiftRepository.findById(shiftId, { includeSeries: true }); if (!shift || shift.isLocked || shift.series?.isLocked) throw new NotFoundException('Ca trợ giảng không tồn tại'); const now = new Date(); if (!shift.selfRegistrationOpenAt || !shift.selfRegistrationCloseAt || now < shift.selfRegistrationOpenAt || now > shift.selfRegistrationCloseAt) throw new BusinessLogicException('Ca chưa trong thời gian tự đăng ký'); if (await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new ConflictException('Bạn đã đăng ký ca này'); return r.assistantShiftAssignmentRepository.create({ assistantShiftId: shiftId, adminId }) }); return BaseResponseDto.success('Đăng ký ca thành công', new AssistantShiftAssignmentResponseDto(item)) } }
@Injectable() export class CancelAssistantShiftRegistrationUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { await this.uow.executeInTransaction(async (r) => { const shift = await r.assistantShiftRepository.findById(shiftId, { includeSeries: true }); if (!shift || shift.isLocked || shift.series?.isLocked) throw new NotFoundException('Ca trợ giảng không tồn tại'); const now = new Date(); if (!shift.selfRegistrationOpenAt || !shift.selfRegistrationCloseAt || now < shift.selfRegistrationOpenAt || now > shift.selfRegistrationCloseAt) throw new BusinessLogicException('Ca chưa trong thời gian tự đăng ký'); if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Bạn chưa đăng ký ca này'); await r.assistantShiftAssignmentRepository.delete(shiftId, adminId) }); return BaseResponseDto.success('Hủy đăng ký ca thành công', { cancelled: true }) } }

@Injectable() export class CreateAssistantShiftAssignmentUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, dto: CreateAssistantShiftAssignmentDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftRepository.findById(shiftId)) throw new NotFoundException('Ca trợ giảng không tồn tại'); await assertEligibleAssistant(dto.adminId, r.adminRepository); return r.assistantShiftAssignmentRepository.create({ assistantShiftId: shiftId, ...dto }) }); return BaseResponseDto.success('Phân công trợ giảng thành công', new AssistantShiftAssignmentResponseDto(item)) } }
@Injectable() export class UpdateAssistantShiftAssignmentUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number, dto: UpdateAssistantShiftAssignmentDto) { const item = await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Phân công không tồn tại'); return r.assistantShiftAssignmentRepository.update(shiftId, adminId, dto) }); return BaseResponseDto.success('Cập nhật phân công thành công', new AssistantShiftAssignmentResponseDto(item)) } }
@Injectable() export class DeleteAssistantShiftAssignmentUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, adminId: number) { await this.uow.executeInTransaction(async (r) => { if (!await r.assistantShiftAssignmentRepository.findById(shiftId, adminId)) throw new NotFoundException('Phân công không tồn tại'); await r.assistantShiftAssignmentRepository.delete(shiftId, adminId) }); return BaseResponseDto.success('Xóa phân công thành công', { deleted: true }) } }
export interface AssistantShiftCheckInPageResult { success: boolean; message: string }
@Injectable() export class CheckInAssistantShiftUseCase { constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {} async execute(shiftId: number, token?: string): Promise<AssistantShiftCheckInPageResult> { try { if (!token?.trim()) throw new BusinessLogicException('Liên kết điểm danh không hợp lệ'); await this.uow.executeInTransaction(async (r) => { const assignment = await r.assistantShiftAssignmentRepository.findByCheckInToken(shiftId, token); if (!assignment) throw new NotFoundException('Liên kết điểm danh không hợp lệ'); if (!assignment.isPending()) throw new BusinessLogicException('Ca này không còn ở trạng thái chờ điểm danh'); const shift = await r.assistantShiftRepository.findById(shiftId); if (!shift) throw new NotFoundException('Liên kết điểm danh không hợp lệ'); const now = new Date(), openAt = new Date(shift.startAt.getTime() - 45 * 60 * 1000); if (now < openAt || now > shift.endAt) throw new BusinessLogicException('Chỉ được điểm danh từ 45 phút trước giờ bắt đầu đến trước khi ca kết thúc'); await r.assistantShiftAssignmentRepository.update(shiftId, assignment.adminId, { attendanceStatus: AssistantShiftAssignmentAttendanceStatus.PRESENT }) }); return { success: true, message: 'Bạn đã điểm danh thành công. Chúc bạn có một ca trợ giảng hiệu quả!' } } catch (error) { if (error instanceof BusinessLogicException || error instanceof NotFoundException) return { success: false, message: error.message }; return { success: false, message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.' } } }

}

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

export interface AssistantShiftReminderEmailFailure {
  type: 'CHECK_IN_REMINDER' | 'ABSENCE_NOTIFICATION'
  assistantShiftId: number
  adminId: number
  recipientEmail: string
  occurredAt: string
  errorMessage: string
  errorCode?: string
  httpStatus?: number
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
      if (latestRun && latestRun.scheduledAt >= scheduledAt) scheduledAt.setTime(latestRun.scheduledAt.getTime() + 1000)
      const run = await repos.backgroundJobRunRepository.create({
        backgroundJobId,
        scheduledAt,
        startedAt: now,
        status: BackgroundJobRunStatus.RUNNING,
        workerId,
        lockToken,
        leaseExpiresAt: lock.leaseExpiresAt,
      })
      return { backgroundJobId, backgroundJobRunId: run.backgroundJobRunId, lockToken }
    })
  }

  private async processAssignments(): Promise<Omit<AssistantShiftReminderJobResult, 'backgroundJobRunId'>> {
    const now = new Date()
    const [checkInCandidates, absenceCandidates] = await Promise.all([
      this.uow.executeInTransaction((repos) => repos.assistantShiftAssignmentRepository.findCheckInReminderCandidates(now)),
      this.uow.executeInTransaction((repos) => repos.assistantShiftAssignmentRepository.findExpiredAbsenceCandidates(now)),
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

    return { checkInEmailsSent, absenceEmailsSent, assignmentsMarkedAbsent, failedEmailCount, emailFailures }
  }

  private createEmailFailure(
    type: AssistantShiftReminderEmailFailure['type'],
    candidate: AssistantShiftReminderCandidate,
    error: unknown,
  ): AssistantShiftReminderEmailFailure {
    const errorRecord = error && typeof error === 'object' ? error as Record<string, unknown> : {}
    const response = errorRecord.response && typeof errorRecord.response === 'object'
      ? errorRecord.response as Record<string, unknown>
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
      ...(typeof errorCode === 'string' && { errorCode: errorCode.slice(0, 100) }),
      ...(typeof status === 'number' && { httpStatus: status }),
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
    const errorMessage = error instanceof Error ? error.message.slice(0, 1000) : 'Lỗi không xác định khi nhắc lịch trợ giảng'
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

function toDateRange(dto: AssistantShiftRangeDto): { startAt: Date; endAt: Date } {
  const startAt = new Date(dto.startAt)
  const endAt = new Date(dto.endAt)
  assertRange(startAt, endAt)
  return { startAt, endAt }
}

@Injectable()
export class CopyAssistantShiftsBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(seriesId: number, dto: CopyAssistantShiftsDto) {
    const copyStartAt = new Date(dto.startCopyAt)
    const copyEndAt = new Date(dto.endCopyAt)
    const pasteStartAt = new Date(dto.startPasteAt)
    const pasteEndAt = new Date(dto.endPasteAt)
    assertRange(copyStartAt, copyEndAt)
    assertRange(pasteStartAt, pasteEndAt)

    if (copyEndAt.getTime() - copyStartAt.getTime() !== pasteEndAt.getTime() - pasteStartAt.getTime()) {
      throw new BusinessLogicException('Khoảng thời gian sao chép và dán phải có cùng độ dài')
    }

    const copyAssignments = dto.copyAssignments ?? true
    const offsetMilliseconds = pasteStartAt.getTime() - copyStartAt.getTime()
    const result = await this.uow.executeInTransaction(async (r) => {
      const series = await r.assistantShiftSeriesRepository.findById(seriesId)
      if (!series) throw new NotFoundException('Chuỗi ca không tồn tại')

      const sourceShifts = await r.assistantShiftRepository.findAll({
        assistantShiftSeriesId: seriesId,
        startAtFrom: copyStartAt,
        startAtTo: copyEndAt,
        includeAssignmentsWithAdmin: copyAssignments,
      })
      if (sourceShifts.length === 0) throw new NotFoundException('Không có ca nào trong khoảng thời gian sao chép')
      if (sourceShifts.some((shift) => shift.endAt > copyEndAt)) {
        throw new BusinessLogicException('Tất cả ca sao chép phải kết thúc trong khoảng thời gian sao chép')
      }
      if (await r.assistantShiftRepository.hasOverlappingTimeRange(seriesId, pasteStartAt, pasteEndAt)) {
        throw new ConflictException('Khoảng thời gian dán đã có ca trợ giảng')
      }

      if (copyAssignments) {
        const assignedAdminIds = new Set(
          sourceShifts.flatMap((shift) => (shift.assignments ?? []).map((assignment) => assignment.adminId)),
        )
        const eligibleAssistants = await r.adminRepository.findAllByRoleId(
          ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID,
        )
        const eligibleAdminIds = new Set(eligibleAssistants.map((assistant) => assistant.adminId))
        if ([...assignedAdminIds].some((adminId) => !eligibleAdminIds.has(adminId))) {
          throw new BusinessLogicException('Chỉ admin có role trợ giảng mới có thể được sao chép phân công ca')
        }
      }

      let copiedAssignmentCount = 0
      for (const sourceShift of sourceShifts) {
        const copiedShift = await r.assistantShiftRepository.create({
          assistantShiftSeriesId: seriesId,
          classId: sourceShift.classId ?? null,
          name: sourceShift.name,
          notes: null,
          startAt: new Date(sourceShift.startAt.getTime() + offsetMilliseconds),
          endAt: new Date(sourceShift.endAt.getTime() + offsetMilliseconds),
          isLocked: sourceShift.isLocked,
          selfRegistrationOpenAt: sourceShift.selfRegistrationOpenAt
            ? new Date(sourceShift.selfRegistrationOpenAt.getTime() + offsetMilliseconds)
            : null,
          selfRegistrationCloseAt: sourceShift.selfRegistrationCloseAt
            ? new Date(sourceShift.selfRegistrationCloseAt.getTime() + offsetMilliseconds)
            : null,
          requiredAssistantCount: sourceShift.requiredAssistantCount,
        })

        if (copyAssignments) {
          for (const assignment of sourceShift.assignments ?? []) {
            await r.assistantShiftAssignmentRepository.create({
              assistantShiftId: copiedShift.assistantShiftId,
              adminId: assignment.adminId,
              attendanceStatus: AssistantShiftAssignmentAttendanceStatus.PENDING,
              absenceReason: null,
              managerNote: null,
            })
            copiedAssignmentCount += 1
          }
        }
      }

      return { copiedShiftCount: sourceShifts.length, copiedAssignmentCount }
    }, { isolationLevel: 'Serializable' })

    return BaseResponseDto.success('Sao chép ca trợ giảng thành công', result)
  }
}

abstract class UpdateAssistantShiftsBySeriesRangeBase {
  constructor(protected readonly uow: IUnitOfWork) {}

  protected async update(
    seriesId: number,
    dto: AssistantShiftRangeDto,
    data: { isLocked?: boolean; selfRegistrationOpenAt?: Date; selfRegistrationCloseAt?: Date },
  ) {
    const { startAt, endAt } = toDateRange(dto)
    return this.uow.executeInTransaction(async (r) => {
      if (!await r.assistantShiftSeriesRepository.findById(seriesId)) throw new NotFoundException('Chuỗi ca không tồn tại')
      return r.assistantShiftRepository.updateBySeriesAndStartAtRange(seriesId, startAt, endAt, data)
    })
  }
}

@Injectable()
export class LockAssistantShiftsBySeriesUseCase extends UpdateAssistantShiftsBySeriesRangeBase {
  constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork) { super(uow) }
  async execute(seriesId: number, dto: AssistantShiftRangeDto) {
    const updatedCount = await this.update(seriesId, dto, { isLocked: true })
    return BaseResponseDto.success('Khóa các ca trợ giảng thành công', { updatedCount })
  }
}

@Injectable()
export class UnlockAssistantShiftsBySeriesUseCase extends UpdateAssistantShiftsBySeriesRangeBase {
  constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork) { super(uow) }
  async execute(seriesId: number, dto: AssistantShiftRangeDto) {
    const updatedCount = await this.update(seriesId, dto, { isLocked: false })
    return BaseResponseDto.success('Mở khóa các ca trợ giảng thành công', { updatedCount })
  }
}

@Injectable()
export class SetAssistantShiftSelfRegistrationWindowBySeriesUseCase extends UpdateAssistantShiftsBySeriesRangeBase {
  constructor(@Inject('UNIT_OF_WORK') uow: IUnitOfWork) { super(uow) }
  async execute(seriesId: number, dto: SetAssistantShiftSelfRegistrationWindowDto) {
    const selfRegistrationOpenAt = new Date(dto.selfRegistrationOpenAt)
    const selfRegistrationCloseAt = new Date(dto.selfRegistrationCloseAt)
    assertRange(selfRegistrationOpenAt, selfRegistrationCloseAt)
    const updatedCount = await this.update(seriesId, dto, { selfRegistrationOpenAt, selfRegistrationCloseAt })
    return BaseResponseDto.success('Đặt thời gian tự đăng ký ca thành công', { updatedCount })
  }
}

@Injectable()
export class GetMyAssistantShiftsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(adminId: number, query: AssistantShiftDateRangeQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) throw new BusinessLogicException('Khoảng thời gian không hợp lệ')

    const data = await this.uow.executeInTransaction((r) => r.assistantShiftRepository.findAll({
      ...range,
      assignedAdminId: adminId,
      includeAssignmentsForAdminId: adminId,
      includeSeries: true,
      includeCourseClass: true,
    }))

    const response = data.map((item) => new AssistantShiftResponseDto(item))
    await attachAssistantAvatarUrls(response, this.mediaUsageRepository, this.minioService)
    return BaseResponseDto.success('Lấy lịch trợ giảng của bạn thành công', response)
  }
}

@Injectable()
export class GetAssistantShiftAssistantStatisticsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(query: AssistantShiftDateRangeQueryDto) {
    const range = query.toRange()
    if (range.startAtFrom > range.startAtTo) {
      throw new BusinessLogicException('Khoảng thời gian không hợp lệ')
    }

    const response = await this.uow.executeInTransaction(async (repos) => {
      const [assistants, shifts] = await Promise.all([
        repos.adminRepository.findAllByRoleId(ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID),
        repos.assistantShiftRepository.findAll({
          ...range,
          includeAssignmentsWithAdmin: true,
        }),
      ])

      const statisticsByAdminId = new Map(
        assistants.map((assistant) => [
          assistant.adminId,
          {
            adminId: assistant.adminId,
            userId: assistant.userId,
            fullName: assistant.getFullName(),
            registeredShiftCount: 0,
            workedHours: 0,
            absentHours: 0,
            pendingHours: 0,
          },
        ]),
      )

      for (const shift of shifts) {
        const hours = (shift.endAt.getTime() - shift.startAt.getTime()) / (60 * 60 * 1000)
        for (const assignment of shift.assignments ?? []) {
          const statistics = statisticsByAdminId.get(assignment.adminId)
          if (!statistics) continue

          statistics.registeredShiftCount += 1
          if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
            statistics.workedHours += hours
          } else if (assignment.attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT) {
            statistics.absentHours += hours
          } else {
            statistics.pendingHours += hours
          }
        }
      }

      return {
        startAt: range.startAtFrom,
        endAt: range.startAtTo,
        assistants: [...statisticsByAdminId.values()].map((statistics) => ({
          ...statistics,
          workedHours: Math.round(statistics.workedHours * 100) / 100,
          absentHours: Math.round(statistics.absentHours * 100) / 100,
          pendingHours: Math.round(statistics.pendingHours * 100) / 100,
        })),
      } satisfies AssistantShiftAssistantStatisticsResponseDto
    })

    return BaseResponseDto.success('Lấy thống kê trợ giảng thành công', response)
  }
}

@Injectable()
export class GetMyAssistantShiftMonthlyStatisticsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(adminId: number) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const monthEnd = new Date(nextMonthStart.getTime() - 1)
    const shifts = await this.uow.executeInTransaction((r) => r.assistantShiftRepository.findAll({
      assignedAdminId: adminId,
      startAtFrom: monthStart,
      startAtTo: monthEnd,
      includeAssignmentsForAdminId: adminId,
    }))

    let workedShiftCount = 0
    let workedHours = 0
    let absentShiftCount = 0
    let absentHours = 0
    for (const shift of shifts) {
      const attendanceStatus = shift.assignments?.[0]?.attendanceStatus
      const hours = (shift.endAt.getTime() - shift.startAt.getTime()) / (60 * 60 * 1000)
      if (attendanceStatus === AssistantShiftAssignmentAttendanceStatus.PRESENT) {
        workedShiftCount += 1
        workedHours += hours
      } else if (attendanceStatus === AssistantShiftAssignmentAttendanceStatus.ABSENT) {
        absentShiftCount += 1
        absentHours += hours
      }
    }

    return BaseResponseDto.success('Lấy thống kê ca trợ giảng tháng này thành công', {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      workedShiftCount,
      workedHours: Math.round(workedHours * 100) / 100,
      absentShiftCount,
      absentHours: Math.round(absentHours * 100) / 100,
    })
  }
}
