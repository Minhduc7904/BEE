import { Inject, Injectable } from '@nestjs/common'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../../shared/enums'
import { ASSISTANT_SHIFT_CONFIG } from '../../../../shared/constants/assistant-shift.constants'
import {
  BusinessLogicException,
  ConflictException,
  NotFoundException,
} from '../../../../shared/exceptions/custom-exceptions'
import { BaseResponseDto, CopyAssistantShiftsDto } from '../../../dtos'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { assertRange } from './assistant-shift.use-case.helpers'

@Injectable()
export class CopyAssistantShiftsBySeriesUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantShiftSeriesId: number, dto: CopyAssistantShiftsDto) {
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
    const result = await this.uow.executeInTransaction(
      async (repos) => {
        const series = await repos.assistantShiftSeriesRepository.findById(assistantShiftSeriesId)
        if (!series) throw new NotFoundException('Chuỗi ca không tồn tại')

        const sourceShifts = await repos.assistantShiftRepository.findAll({
          assistantShiftSeriesId,
          startAtFrom: copyStartAt,
          startAtTo: copyEndAt,
          excludeBaseShifts: true,
          includeAssignmentsWithAdmin: copyAssignments,
        })
        if (sourceShifts.length === 0) {
          throw new NotFoundException('Không có ca nào trong khoảng thời gian sao chép')
        }
        if (sourceShifts.some((shift) => shift.endAt > copyEndAt)) {
          throw new BusinessLogicException('Tất cả ca sao chép phải kết thúc trong khoảng thời gian sao chép')
        }
        if (
          await repos.assistantShiftRepository.hasOverlappingTimeRange(assistantShiftSeriesId, pasteStartAt, pasteEndAt)
        ) {
          throw new ConflictException('Khoảng thời gian dán đã có ca trợ giảng')
        }

        if (copyAssignments) {
          const assignedAdminIds = new Set(
            sourceShifts.flatMap((shift) => (shift.assignments ?? []).map((assignment) => assignment.adminId)),
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
        for (const sourceShift of sourceShifts) {
          const copiedShift = await repos.assistantShiftRepository.create({
            assistantShiftSeriesId,
            classId: sourceShift.classId ?? null,
            name: sourceShift.name,
            notes: null,
            startAt: new Date(sourceShift.startAt.getTime() + offsetMilliseconds),
            endAt: new Date(sourceShift.endAt.getTime() + offsetMilliseconds),
            isLocked: sourceShift.isLocked,
            isBaseShift: false,
            selfRegistrationOpenAt: sourceShift.selfRegistrationOpenAt
              ? new Date(sourceShift.selfRegistrationOpenAt.getTime() + offsetMilliseconds)
              : null,
            selfRegistrationCloseAt: sourceShift.selfRegistrationCloseAt
              ? new Date(sourceShift.selfRegistrationCloseAt.getTime() + offsetMilliseconds)
              : null,
            requiredAssistantCount: sourceShift.requiredAssistantCount,
          })

          if (!copyAssignments) continue
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

        return {
          copiedShiftCount: sourceShifts.length,
          copiedAssignmentCount,
        }
      },
      { isolationLevel: 'Serializable' },
    )

    return BaseResponseDto.success('Sao chép ca trợ giảng thành công', result)
  }
}
