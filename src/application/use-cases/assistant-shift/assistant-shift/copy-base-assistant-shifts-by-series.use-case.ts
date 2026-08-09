import { Inject, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'
import { ASSISTANT_SHIFT_CONFIG } from '../../../../shared/constants/assistant-shift.constants'
import {
  BusinessLogicException,
  ConflictException,
  NotFoundException,
} from '../../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto, CopyBaseAssistantShiftsDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { copyBaseShiftTimeToWeek, getBaseShiftCopyTargetWeek } from './assistant-shift.use-case.helpers'

@Injectable()
export class CopyBaseAssistantShiftsBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(dto: CopyBaseAssistantShiftsDto) {
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

        return { copiedShiftCount: copiedShifts.length, copiedAssignmentCount }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Sao chép ca cơ sở thành công', result)
  }
}
