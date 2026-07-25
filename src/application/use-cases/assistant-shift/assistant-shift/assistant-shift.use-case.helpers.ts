import { AssistantShiftResponseDto, AssistantShiftRangeDto } from '../../../dtos'
import type { AssistantShift } from '../../../../domain/entities'
import type { IAdminRepository, IMediaUsageRepository } from '../../../../domain/repositories'
import { MediaStatus } from '../../../../shared/enums'
import { EntityType } from '../../../../shared/constants/entity-type.constants'
import { USER_MEDIA_FIELDS } from '../../../../shared/constants'
import { ASSISTANT_SHIFT_CONFIG } from '../../../../shared/constants/assistant-shift.constants'
import { BusinessLogicException, NotFoundException } from '../../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../interfaces'

const AVATAR_URL_EXPIRY_SECONDS = 3600 * 24

export const assistantShiftDetails = {
  includeSeries: true,
  includeAssignmentsWithAdmin: true,
  includeCourseClass: true,
}

export async function assertEligibleAssistant(adminId: number, adminRepository: IAdminRepository) {
  const admin = await adminRepository.findById(adminId)
  if (!admin) throw new NotFoundException('Trợ giảng không tồn tại')
  if (!admin.user?.hasRole(ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID)) {
    throw new BusinessLogicException('Chỉ admin có role trợ giảng mới có thể đăng ký hoặc được phân công ca')
  }

  return admin
}

export async function attachAssistantAvatarUrls(
  shifts: AssistantShiftResponseDto[],
  mediaUsageRepository: IMediaUsageRepository,
  minioService: MinioService,
): Promise<void> {
  const assignments = shifts.flatMap((shift) => shift.assignments ?? [])
  const userIds = [
    ...new Set(
      assignments.map((assignment) => assignment.admin?.userId).filter((id): id is number => id !== undefined),
    ),
  ]
  if (userIds.length === 0) return

  const usages = await mediaUsageRepository.findByEntities(EntityType.USER, userIds, USER_MEDIA_FIELDS.AVATAR)
  const avatarMediaByUserId = new Map<number, (typeof usages)[number]['media']>()
  for (const usage of usages) {
    const media = usage.media
    if (media && media.status === MediaStatus.READY && !avatarMediaByUserId.has(usage.entityId)) {
      avatarMediaByUserId.set(usage.entityId, media)
    }
  }

  const avatarUrlByUserId = new Map<number, string>()
  await Promise.all(
    [...avatarMediaByUserId].map(async ([userId, media]) => {
      if (!media) return
      try {
        avatarUrlByUserId.set(
          userId,
          await minioService.getPresignedUrl(media.bucketName, media.objectKey, AVATAR_URL_EXPIRY_SECONDS),
        )
      } catch {
        // Avatar is optional.
      }
    }),
  )

  for (const assignment of assignments) {
    if (assignment.admin) {
      assignment.admin.avatarUrl = avatarUrlByUserId.get(assignment.admin.userId)
    }
  }
}

export function assertRange(startAt: Date, endAt: Date): void {
  if (endAt <= startAt) {
    throw new BusinessLogicException('Thời gian kết thúc phải sau thời gian bắt đầu')
  }
}

export function assertSelfRegistrationWindow(
  selfRegistrationOpenAt: Date | null,
  selfRegistrationCloseAt: Date | null,
): void {
  if (selfRegistrationOpenAt && selfRegistrationCloseAt) {
    assertRange(selfRegistrationOpenAt, selfRegistrationCloseAt)
  }
}

export function isWithinSelfRegistrationWindow(
  shift: Pick<AssistantShift, 'selfRegistrationOpenAt' | 'selfRegistrationCloseAt'>,
  now: Date,
): boolean {
  return (
    (!shift.selfRegistrationOpenAt || now >= shift.selfRegistrationOpenAt) &&
    (!shift.selfRegistrationCloseAt || now < shift.selfRegistrationCloseAt)
  )
}

export function assertAssistantShiftAvailableToAssistant(
  shift: AssistantShift | null,
): asserts shift is AssistantShift {
  if (!shift || shift.isBaseShift || shift.isLocked || shift.series?.isLocked) {
    throw new NotFoundException('Ca trợ giảng không tồn tại')
  }
}

export function createBaseShiftDate(weekday: number, time: string): Date {
  const [hours, minutes] = parseBaseShiftTime(time)
  const weekStart = toVietnamDate(new Date(ASSISTANT_SHIFT_CONFIG.BASE_SHIFT_WEEK_START_AT))

  return new Date(
    Date.UTC(
      weekStart.getUTCFullYear(),
      weekStart.getUTCMonth(),
      weekStart.getUTCDate() + weekday - 1,
      hours - 7,
      minutes,
    ),
  )
}

export function getBaseShiftWeekday(date: Date): number {
  const weekStart = new Date(ASSISTANT_SHIFT_CONFIG.BASE_SHIFT_WEEK_START_AT)
  const dayOffset = Math.floor((date.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
  if (dayOffset < 0 || dayOffset > 6) {
    throw new BusinessLogicException('Ca cơ sở phải thuộc tuần 20/07/2026 đến 26/07/2026')
  }

  return dayOffset + 1
}

export function getBaseShiftTime(date: Date): string {
  const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  return `${String(vietnamDate.getUTCHours()).padStart(2, '0')}:${String(vietnamDate.getUTCMinutes()).padStart(2, '0')}`
}

export function getBaseShiftCopyTargetWeek(startPasteAt: Date, endPasteAt: Date): { startAt: Date; endAt: Date } {
  if (endPasteAt < startPasteAt) {
    throw new BusinessLogicException('Thời gian kết thúc dán phải không trước thời gian bắt đầu dán')
  }

  const startAt = getVietnamWeekStart(startPasteAt)
  const endWeekStart = getVietnamWeekStart(endPasteAt)
  if (startAt.getTime() !== endWeekStart.getTime()) {
    throw new BusinessLogicException('Thời gian dán phải nằm trong cùng một tuần từ Thứ Hai đến Chủ Nhật')
  }

  return {
    startAt,
    endAt: new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  }
}

export function copyBaseShiftTimeToWeek(baseShiftDate: Date, targetWeekStart: Date): Date {
  const weekday = getBaseShiftWeekday(baseShiftDate)
  const vietnamDate = new Date(baseShiftDate.getTime() + 7 * 60 * 60 * 1000)
  const vietnamTargetWeekStart = toVietnamDate(targetWeekStart)
  const hours = vietnamDate.getUTCHours()
  const minutes = vietnamDate.getUTCMinutes()

  return new Date(
    Date.UTC(
      vietnamTargetWeekStart.getUTCFullYear(),
      vietnamTargetWeekStart.getUTCMonth(),
      vietnamTargetWeekStart.getUTCDate() + weekday - 1,
      hours - 7,
      minutes,
    ),
  )
}

function parseBaseShiftTime(value: string): [number, number] {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    throw new BusinessLogicException('Giờ ca phải theo định dạng HH:mm')
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) {
    throw new BusinessLogicException('Giờ ca không hợp lệ')
  }

  return [hours, minutes]
}

function getVietnamWeekStart(date: Date): Date {
  const vietnamDate = toVietnamDate(date)
  const sundayBasedDay = vietnamDate.getUTCDay()
  const mondayOffset = sundayBasedDay === 0 ? 6 : sundayBasedDay - 1

  return new Date(
    Date.UTC(vietnamDate.getUTCFullYear(), vietnamDate.getUTCMonth(), vietnamDate.getUTCDate() - mondayOffset, -7),
  )
}

function toVietnamDate(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
}

export function toDateRange(dto: AssistantShiftRangeDto): { startAt: Date; endAt: Date } {
  const startAt = new Date(dto.startAt)
  const endAt = new Date(dto.endAt)
  assertRange(startAt, endAt)
  return { startAt, endAt }
}
