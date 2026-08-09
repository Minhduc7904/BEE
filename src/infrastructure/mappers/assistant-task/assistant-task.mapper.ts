import type { AssistantTask as PrismaAssistantTask, Prisma } from '@prisma/client'

import { AssistantTask } from '../../../domain/entities/assistant-task'
import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

import { AssistantTaskProductMapper } from './assistant-task-product.mapper'

type PrismaAssistantTaskWithProducts = Prisma.AssistantTaskGetPayload<{
  include: {
    submissions: {
      include: {
        assistantTaskProduct: {
          include: {
            exam: {
              select: {
                title: true
                solutionYoutubeUrl: true
              }
            }
          }
        }
      }
    }
  }
}>

export class AssistantTaskMapper {
  static toDomain(record: PrismaAssistantTask | null | undefined): AssistantTask | null {
    if (!record) return null

    return new AssistantTask({
      assistantTaskId: record.assistantTaskId,
      courseId: record.courseId,
      assistantId: record.assistantId,
      taskName: record.taskName,
      taskType: record.taskType as AssistantTaskType | null,
      status: record.status as AssistantTaskStatus,
      isBaseTask: record.isBaseTask,
      deadlineAt: record.deadlineAt,
      completedAt: record.completedAt,
      note: record.note,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainWithProducts(record: PrismaAssistantTaskWithProducts | null | undefined): AssistantTask | null {
    const task = this.toDomain(record)
    if (!task || !record) return null

    task.products = AssistantTaskProductMapper.toDomainListWithExam(
      record.submissions.map((submission) => submission.assistantTaskProduct),
    )
    return task
  }

  static toDomainList(records: PrismaAssistantTask[] | null | undefined): AssistantTask[] {
    if (!records?.length) return []

    return records.map((record) => this.toDomain(record)).filter((record): record is AssistantTask => record !== null)
  }

  static toDomainListWithProducts(records: PrismaAssistantTaskWithProducts[] | null | undefined): AssistantTask[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithProducts(record))
      .filter((record): record is AssistantTask => record !== null)
  }
}
