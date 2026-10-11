import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'
import { ASSISTANT_SHIFT_CONFIG } from '../../../../shared/constants/assistant-shift.constants'
import { ACTION_KEYS } from '../../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../../shared/enums/audit-status.enum'
import {
  BusinessLogicException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto, CopyBaseAssistantShiftsDto } from '../../../dtos'
import type { AssistantShift } from '../../../../domain/entities'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../../domain/repositories'
import { copyBaseShiftTimeToWeek, getBaseShiftCopyTargetWeek } from './assistant-shift.use-case.helpers'
import { buildClassSessionKey, buildClassSessionName, toClassSessionDate } from './copy-base-class-session.helper'

export interface CopyBaseAssistantShiftsOptions {
  adminId?: number
  /** Người gọi có quyền class-session:create; bắt buộc khi bật `createClassSessions`. */
  canCreateClassSession?: boolean
}

interface CopiedBaseShift {
  sourceShift: AssistantShift
  startAt: Date
  endAt: Date
}

export interface CopyBaseClassSessionsResult {
  createdSessionCount: number
  skippedExistingSessionCount: number
  skippedNoClassCount: number
  skippedEndedCourseCount: number
}

@Injectable()
export class CopyBaseAssistantShiftsBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(dto: CopyBaseAssistantShiftsDto, options: CopyBaseAssistantShiftsOptions = {}) {
    const createClassSessions = dto.createClassSessions ?? false
    if (createClassSessions && !options.canCreateClassSession) {
      throw new ForbiddenException('Bạn không có quyền tạo buổi học (class-session:create)')
    }

    const targetWeek = getBaseShiftCopyTargetWeek(new Date(dto.startPasteAt), new Date(dto.endPasteAt))
    const copyAssignments = dto.copyAssignments ?? true
    const copyAssignmentAttendanceStatus = dto.copyAssignmentAttendanceStatus ?? false

    if (dto.ids.length === 0) {
      throw new BusinessLogicException('Phải chọn ít nhất một ca cơ sở để sao chép')
    }

    if (new Set(dto.ids).size !== dto.ids.length) {
      throw new BusinessLogicException('Danh sách ID ca cơ sở không được trùng lặp')
    }

    const result = await this.uow.executeInTransaction(
      async (repos) => {
        const sourceShifts = await Promise.all(
          dto.ids.map((assistantShiftId) =>
            repos.assistantShiftRepository.findById(assistantShiftId, {
              includeAssignmentsWithAdmin: copyAssignments,
            }),
          ),
        )
        if (sourceShifts.some((shift) => !shift || !shift.isBaseShift)) {
          throw new NotFoundException('Một hoặc nhiều ca cơ sở không tồn tại')
        }

        const baseShifts = sourceShifts.filter((shift): shift is NonNullable<typeof shift> => Boolean(shift))
        const copiedShifts = await Promise.all(
          baseShifts.map(async (sourceShift) => {
            const startAt = copyBaseShiftTimeToWeek(sourceShift.startAt, targetWeek.startAt)
            const endAt = copyBaseShiftTimeToWeek(sourceShift.endAt, targetWeek.startAt)
            if (
              await repos.assistantShiftRepository.hasOverlappingTimeRange(
                sourceShift.assistantShiftSeriesId,
                startAt,
                endAt,
                undefined,
                { ignoreBaseShifts: true },
              )
            ) {
              throw new ConflictException('Khoảng thời gian dán đã có ca trợ giảng')
            }

            return { sourceShift, startAt, endAt }
          }),
        )

        if (copyAssignments) {
          const assignedAdminIds = new Set(
            baseShifts.flatMap((sourceShift) =>
              (sourceShift.assignments ?? []).map((assignment) => assignment.adminId),
            ),
          )
          const eligibleAssistants = await repos.adminRepository.findAllByRoleId(
            ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID,
          )
          const eligibleAdminIds = new Set(eligibleAssistants.map((assistant) => assistant.adminId))
          if ([...assignedAdminIds].some((adminId) => !eligibleAdminIds.has(adminId))) {
            throw new BusinessLogicException('Chỉ admin có role trợ giảng mới có thể được sao chép phân công ca')
          }
        }

        let copiedAssignmentCount = 0
        for (const { sourceShift, startAt, endAt } of copiedShifts) {
          const copiedShift = await repos.assistantShiftRepository.create({
            assistantShiftSeriesId: sourceShift.assistantShiftSeriesId,
            classId: sourceShift.classId ?? null,
            name: sourceShift.name,
            notes: sourceShift.notes ?? null,
            startAt,
            endAt,
            requiredAssistantCount: sourceShift.requiredAssistantCount,
            isBaseShift: false,
            isLocked: false,
            selfRegistrationOpenAt: null,
            selfRegistrationCloseAt: null,
          })

          if (copyAssignments) {
            for (const assignment of sourceShift.assignments ?? []) {
              await repos.assistantShiftAssignmentRepository.create({
                assistantShiftId: copiedShift.assistantShiftId,
                adminId: assignment.adminId,
                attendanceStatus: copyAssignmentAttendanceStatus
                  ? assignment.attendanceStatus
                  : AssistantShiftAssignmentAttendanceStatus.PENDING,
                absenceReason: null,
                managerNote: null,
              })
              copiedAssignmentCount += 1
            }
          }
        }

        const sessionResult = createClassSessions
          ? await this.createClassSessionsForShifts(repos, copiedShifts, options.adminId)
          : null

        return { copiedShiftCount: copiedShifts.length, copiedAssignmentCount, ...sessionResult }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Sao chép ca cơ sở thành công', result)
  }

  /**
   * Sinh buổi học cho từng ca đã gắn lớp: tên "Buổi dd/mm", giờ lấy từ ca. Buổi đã có (cùng lớp, ngày, giờ bắt đầu)
   * và ca không gắn lớp hoặc thuộc khóa học đã kết thúc được bỏ qua, không làm hỏng cả đợt copy.
   */
  private async createClassSessionsForShifts(
    repos: UnitOfWorkRepos,
    copiedShifts: CopiedBaseShift[],
    adminId?: number,
  ): Promise<CopyBaseClassSessionsResult> {
    const shiftsWithClass = copiedShifts.filter(({ sourceShift }) => sourceShift.classId != null)
    const skippedNoClassCount = copiedShifts.length - shiftsWithClass.length
    const classIds = [...new Set(shiftsWithClass.map(({ sourceShift }) => sourceShift.classId as number))]
    const courseClasses = classIds.length > 0 ? await repos.courseClassRepository.findByIds(classIds) : []
    const courseClassById = new Map(courseClasses.map((courseClass) => [courseClass.classId, courseClass]))

    let skippedEndedCourseCount = 0
    const planned: Array<{ classId: number; name: string; sessionDate: Date; startTime: Date; endTime: Date }> = []
    for (const { sourceShift, startAt, endAt } of shiftsWithClass) {
      const classId = sourceShift.classId as number
      const courseClass = courseClassById.get(classId)
      if (!courseClass) {
        throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`)
      }
      if (courseClass.course?.isEnded) {
        skippedEndedCourseCount += 1
        continue
      }
      planned.push({
        classId,
        name: buildClassSessionName(startAt),
        sessionDate: toClassSessionDate(startAt),
        startTime: startAt,
        endTime: endAt,
      })
    }

    const knownKeys = new Set<string>()
    if (planned.length > 0) {
      const dates = planned.map((session) => session.sessionDate.getTime())
      const existingSessions = await repos.classSessionRepository.findByClassIdsAndSessionDateRange(
        [...new Set(planned.map((session) => session.classId))],
        new Date(Math.min(...dates)),
        new Date(Math.max(...dates)),
      )
      for (const existing of existingSessions) {
        knownKeys.add(buildClassSessionKey(existing.classId, existing.sessionDate, existing.startTime))
      }
    }

    let createdSessionCount = 0
    let skippedExistingSessionCount = 0
    for (const session of planned) {
      const key = buildClassSessionKey(session.classId, session.sessionDate, session.startTime)
      if (knownKeys.has(key)) {
        skippedExistingSessionCount += 1
        continue
      }
      knownKeys.add(key)

      const created = await repos.classSessionRepository.create(session)
      createdSessionCount += 1

      if (adminId) {
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.CLASS_SESSION.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.CLASS_SESSION,
          resourceId: created.sessionId.toString(),
          afterData: {
            classId: created.classId,
            sessionDate: created.sessionDate,
            name: created.name,
            source: 'COPY_BASE_ASSISTANT_SHIFT',
          },
        })
      }
    }

    return { createdSessionCount, skippedExistingSessionCount, skippedNoClassCount, skippedEndedCourseCount }
  }
}
