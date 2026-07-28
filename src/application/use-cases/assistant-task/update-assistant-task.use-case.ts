import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskResponseDto, BaseResponseDto, UpdateAssistantTaskDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AssistantTaskStatus } from '../../../shared/enums'
import { InvalidStateException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'

@Injectable()
export class UpdateAssistantTaskUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(assistantTaskId: number, dto: UpdateAssistantTaskDto, actorAdminId: number) {
    const task = await this.uow.executeInTransaction(async (repos) => {
      const current = await repos.assistantTaskRepository.findById(assistantTaskId)
      if (!current) throw new NotFoundException('Công việc trợ giảng không tồn tại')

      if (
        current.status === AssistantTaskStatus.COMPLETED &&
        dto.assistantId !== undefined &&
        dto.assistantId !== current.assistantId
      ) {
        throw new InvalidStateException('Không thể đổi trợ giảng của công việc đã hoàn thành')
      }

      const submissionCount = await repos.assistantTaskProductSubmissionRepository.countByTaskId(assistantTaskId)
      if (submissionCount > 0 && dto.status !== undefined && dto.status !== current.status) {
        throw new InvalidStateException('Không thể đổi trạng thái của công việc đã có sản phẩm')
      }

      if (dto.courseId !== undefined && dto.courseId !== null) {
        const course = await repos.courseRepository.findById(dto.courseId)
        if (!course) throw new NotFoundException('Khóa học không tồn tại')
      }
      if (dto.assistantId !== undefined && dto.assistantId !== null) {
        const assistant = await repos.adminRepository.findById(dto.assistantId)
        if (!assistant) throw new NotFoundException('Trợ giảng không tồn tại')
      }

      const hasCompletedAt = Object.hasOwn(dto, 'completedAt')
      const updated = await repos.assistantTaskRepository.update(assistantTaskId, {
        courseId: dto.courseId,
        assistantId: dto.assistantId,
        taskName: dto.taskName,
        taskType: dto.taskType,
        status: dto.status,
        isBaseTask: dto.isBaseTask,
        deadlineAt: dto.deadlineAt !== undefined ? (dto.deadlineAt ? new Date(dto.deadlineAt) : null) : undefined,
        completedAt: hasCompletedAt
          ? dto.completedAt
            ? new Date(dto.completedAt)
            : null
          : dto.status === AssistantTaskStatus.COMPLETED && current.status !== AssistantTaskStatus.COMPLETED
            ? new Date()
            : dto.status !== undefined &&
                dto.status !== AssistantTaskStatus.COMPLETED &&
                current.status === AssistantTaskStatus.COMPLETED
              ? null
              : undefined,
        note: dto.note,
      })

      await writeAssistantTaskAudit(repos, {
        adminId: actorAdminId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK.UPDATE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK,
        resourceId: assistantTaskId,
        beforeData: current,
        afterData: updated,
      })

      return updated
    })

    return BaseResponseDto.success('Cập nhật công việc trợ giảng thành công', new AssistantTaskResponseDto(task))
  }
}
