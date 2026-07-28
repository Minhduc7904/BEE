import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskResponseDto, BaseResponseDto, CreateAssistantTaskDto } from '../../dtos'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AssistantTaskStatus } from '../../../shared/enums'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { writeAssistantTaskAudit } from './assistant-task.use-case.helpers'

@Injectable()
export class CreateAssistantTaskUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork) {}

  async execute(dto: CreateAssistantTaskDto, actorAdminId: number) {
    const task = await this.uow.executeInTransaction(async (repos) => {
      if (dto.courseId !== undefined && dto.courseId !== null) {
        const course = await repos.courseRepository.findById(dto.courseId)
        if (!course) throw new NotFoundException('Khóa học không tồn tại')
      }

      if (dto.assistantId !== undefined && dto.assistantId !== null) {
        const assistant = await repos.adminRepository.findById(dto.assistantId)
        if (!assistant) throw new NotFoundException('Trợ giảng không tồn tại')
      }

      const created = await repos.assistantTaskRepository.create({
        courseId: dto.courseId,
        assistantId: dto.assistantId,
        taskName: dto.taskName,
        taskType: dto.taskType,
        status: dto.status,
        isBaseTask: dto.isBaseTask,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
        completedAt:
          dto.completedAt !== undefined
            ? dto.completedAt
              ? new Date(dto.completedAt)
              : null
            : dto.status === AssistantTaskStatus.COMPLETED
              ? new Date()
              : null,
        note: dto.note,
      })

      await writeAssistantTaskAudit(repos, {
        adminId: actorAdminId,
        actionKey: ACTION_KEYS.ASSISTANT_TASK.CREATE,
        resourceType: RESOURCE_TYPES.ASSISTANT_TASK,
        resourceId: created.assistantTaskId,
        afterData: created,
      })

      return created
    })

    return BaseResponseDto.success('Tạo công việc trợ giảng thành công', new AssistantTaskResponseDto(task))
  }
}
