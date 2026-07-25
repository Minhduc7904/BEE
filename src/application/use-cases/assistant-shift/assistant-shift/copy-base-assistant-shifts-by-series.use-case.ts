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

  async execute(assistantShiftId: number, dto: CopyBaseAssistantShiftsDto) {
    const targetWeek = getBaseShiftCopyTargetWeek(new Date(dto.startPasteAt), new Date(dto.endPasteAt))
    const copyAssignments = dto.copyAssignments ?? true

    const result = await this.uow.executeInTransaction(
      async (repos) => {
        const sourceShift = await repos.assistantShiftRepository.findById(assistantShiftId, {
          includeAssignmentsWithAdmin: copyAssignments,
        })
        if (!sourceShift || !sourceShift.isBaseShift) {
          throw new NotFoundException('Ca cơ sở không tồn tại')
        }
        const startAt = copyBaseShiftTimeToWeek(sourceShift.startAt, targetWeek.startAt)
        const endAt = copyBaseShiftTimeToWeek(sourceShift.endAt, targetWeek.startAt)
        if (
          await repos.assistantShiftRepository.hasOverlappingTimeRange(
            sourceShift.assistantShiftSeriesId,
            startAt,
            endAt,
          )
        ) {
          throw new ConflictException('Khoảng thời gian dán đã có ca trợ giảng')
        }

        if (copyAssignments) {
          const assignedAdminIds = new Set((sourceShift.assignments ?? []).map((assignment) => assignment.adminId))
          const eligibleAssistants = await repos.adminRepository.findAllByRoleId(
            ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID,
          )
          const eligibleAdminIds = new Set(eligibleAssistants.map((assistant) => assistant.adminId))
          if ([...assignedAdminIds].some((adminId) => !eligibleAdminIds.has(adminId))) {
            throw new BusinessLogicException('Chỉ admin có role trợ giảng mới có thể được sao chép phân công ca')
          }
        }

        let copiedAssignmentCount = 0
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
              attendanceStatus: AssistantShiftAssignmentAttendanceStatus.PENDING,
              absenceReason: null,
              managerNote: null,
            })
            copiedAssignmentCount += 1
          }
        }

        return { copiedShiftCount: 1, copiedAssignmentCount }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )

    return BaseResponseDto.success('Sao chép ca cơ sở thành công', result)
  }
}
