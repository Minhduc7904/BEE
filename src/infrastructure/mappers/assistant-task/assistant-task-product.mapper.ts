import type { AssistantTaskProduct as PrismaAssistantTaskProduct, Prisma } from '@prisma/client'

import { AssistantTask, AssistantTaskProduct } from '../../../domain/entities/assistant-task'
import { AssistantTaskStatus, AssistantTaskType } from '../../../shared/enums'

type PrismaAssistantTaskProductWithTasks = Prisma.AssistantTaskProductGetPayload<{
  include: {
    submissions: {
      include: { assistantTask: true }
    }
  }
}>

type PrismaAssistantTaskProductWithExam = Prisma.AssistantTaskProductGetPayload<{
  include: {
    exam: {
      select: {
        title: true
        solutionYoutubeUrl: true
      }
    }
  }
}>

export class AssistantTaskProductMapper {
  static toDomain(record: PrismaAssistantTaskProduct | null | undefined): AssistantTaskProduct | null {
    if (!record) return null

    return new AssistantTaskProduct({
      assistantTaskProductId: record.assistantTaskProductId,
      assistantId: record.assistantId,
      examId: record.examId,
      name: record.name,
      quantity: record.quantity,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  static toDomainWithTasks(
    record: PrismaAssistantTaskProductWithTasks | null | undefined,
  ): AssistantTaskProduct | null {
    const product = this.toDomain(record)
    if (!product || !record) return null

    product.tasks = record.submissions.map(
      ({ assistantTask }) =>
        new AssistantTask({
          assistantTaskId: assistantTask.assistantTaskId,
          courseId: assistantTask.courseId,
          assistantId: assistantTask.assistantId,
          taskName: assistantTask.taskName,
          taskType: assistantTask.taskType as AssistantTaskType | null,
          status: assistantTask.status as AssistantTaskStatus,
          isBaseTask: assistantTask.isBaseTask,
          deadlineAt: assistantTask.deadlineAt,
          completedAt: assistantTask.completedAt,
          note: assistantTask.note,
          createdAt: assistantTask.createdAt,
          updatedAt: assistantTask.updatedAt,
        }),
    )

    return product
  }

  static toDomainWithExam(record: PrismaAssistantTaskProductWithExam | null | undefined): AssistantTaskProduct | null {
    const product = this.toDomain(record)
    if (!product || !record) return null

    product.examName = record.exam?.title ?? null
    product.solutionYoutubeUrl = record.exam?.solutionYoutubeUrl ?? null
    return product
  }

  static toDomainList(records: PrismaAssistantTaskProduct[] | null | undefined): AssistantTaskProduct[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomain(record))
      .filter((record): record is AssistantTaskProduct => record !== null)
  }

  static toDomainListWithTasks(
    records: PrismaAssistantTaskProductWithTasks[] | null | undefined,
  ): AssistantTaskProduct[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithTasks(record))
      .filter((record): record is AssistantTaskProduct => record !== null)
  }

  static toDomainListWithExam(
    records: PrismaAssistantTaskProductWithExam[] | null | undefined,
  ): AssistantTaskProduct[] {
    if (!records?.length) return []

    return records
      .map((record) => this.toDomainWithExam(record))
      .filter((record): record is AssistantTaskProduct => record !== null)
  }
}
