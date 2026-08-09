import { Inject, Injectable } from '@nestjs/common'

import { AssistantTaskListQueryDto, AssistantTaskResponseDto, PaginationResponseDto } from '../../dtos'
import type { AssistantTaskProductExamMedia } from '../../dtos'
import type { AssistantTask } from '../../../domain/entities/assistant-task'
import type { IMediaUsageRepository, IUnitOfWork } from '../../../domain/repositories'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { EXAM_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { assertDateRange } from './assistant-task.use-case.helpers'

@Injectable()
export class GetAssistantTasksUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly uow: IUnitOfWork,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  async execute(query: AssistantTaskListQueryDto) {
    assertDateRange(query.startAt, query.endAt)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const options = {
      skip: (page - 1) * limit,
      take: limit,
      courseId: query.courseId,
      assistantId: query.assistantId,
      productId: query.productId,
      taskName: query.taskName,
      taskType: query.taskType,
      status: query.status,
      isBaseTask: query.isBaseTask,
      deadlineAtFrom: query.startAt ? new Date(query.startAt) : undefined,
      deadlineAtTo: query.endAt ? new Date(query.endAt) : undefined,
      includeProducts: query.includeProducts,
    }

    const { items, total } = await this.uow.executeInTransaction(async (repos) => ({
      items: await repos.assistantTaskRepository.findAll(options),
      total: await repos.assistantTaskRepository.count(options),
    }))
    const examMediaByExamId = query.includeProducts ? await this.findExamMediaFileNames(items) : undefined

    return PaginationResponseDto.success(
      'Lấy danh sách công việc trợ giảng thành công',
      items.map((item) => new AssistantTaskResponseDto(item, examMediaByExamId)),
      page,
      limit,
      total,
    )
  }

  private async findExamMediaFileNames(
    items: AssistantTask[],
  ): Promise<ReadonlyMap<number, AssistantTaskProductExamMedia>> {
    const examIds = [
      ...new Set(
        items
          .flatMap((task) => task.products ?? [])
          .map((product) => product.examId)
          .filter((examId): examId is number => examId !== null),
      ),
    ]
    const examMediaByExamId = new Map<number, AssistantTaskProductExamMedia>()

    if (!examIds.length) return examMediaByExamId

    const usages = await this.mediaUsageRepository.findByEntities(EntityType.EXAM, examIds)
    for (const usage of usages) {
      const mediaFileName = usage.media?.originalFilename ?? null
      const current = examMediaByExamId.get(usage.entityId) ?? {
        examFileName: null,
        examSolutionFileName: null,
      }

      if (usage.fieldName === EXAM_MEDIA_FIELDS.EXAM_FILE) {
        current.examFileName = mediaFileName
      }
      if (usage.fieldName === EXAM_MEDIA_FIELDS.SOLUTION_FILE || usage.fieldName === 'EXAM_SOLUTION_FILE') {
        current.examSolutionFileName = mediaFileName
      }

      examMediaByExamId.set(usage.entityId, current)
    }

    return examMediaByExamId
  }
}
