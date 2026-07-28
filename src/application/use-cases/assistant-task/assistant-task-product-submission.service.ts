import { Injectable } from '@nestjs/common'

import { AssistantTaskProductSubmission } from '../../../domain/entities/assistant-task'
import type { UnitOfWorkRepos } from '../../../domain/repositories'
import { AssistantTaskStatus } from '../../../shared/enums'
import {
  ConflictException,
  NotFoundException,
  PermissionDeniedException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class AssistantTaskProductSubmissionService {
  async submit(
    repos: UnitOfWorkRepos,
    assistantTaskId: number,
    assistantTaskProductId: number,
    ownerAssistantId?: number,
  ): Promise<AssistantTaskProductSubmission> {
    const { task, product } = await this.loadResources(repos, assistantTaskId, assistantTaskProductId)
    this.assertOwnerAccess(task.assistantId, product.assistantId, ownerAssistantId)

    const existing = await repos.assistantTaskProductSubmissionRepository.findByTaskAndProduct(
      assistantTaskId,
      assistantTaskProductId,
    )
    if (existing) throw new ConflictException('Sản phẩm đã được gắn vào công việc')

    const submission = await repos.assistantTaskProductSubmissionRepository.create(
      assistantTaskId,
      assistantTaskProductId,
    )
    await repos.assistantTaskRepository.update(assistantTaskId, {
      status: AssistantTaskStatus.COMPLETED,
      completedAt: task.completedAt ?? submission.submittedAt,
    })

    return submission
  }

  async remove(
    repos: UnitOfWorkRepos,
    assistantTaskId: number,
    assistantTaskProductId: number,
    ownerAssistantId?: number,
  ): Promise<AssistantTaskProductSubmission> {
    const { task, product } = await this.loadResources(repos, assistantTaskId, assistantTaskProductId)
    this.assertOwnerAccess(task.assistantId, product.assistantId, ownerAssistantId)

    const submission = await repos.assistantTaskProductSubmissionRepository.findByTaskAndProduct(
      assistantTaskId,
      assistantTaskProductId,
    )
    if (!submission) {
      throw new NotFoundException('Sản phẩm chưa được gắn vào công việc')
    }

    await repos.assistantTaskProductSubmissionRepository.delete(assistantTaskId, assistantTaskProductId)
    const remaining = await repos.assistantTaskProductSubmissionRepository.countByTaskId(assistantTaskId)
    if (remaining === 0) {
      await repos.assistantTaskRepository.update(assistantTaskId, {
        status: AssistantTaskStatus.PENDING,
        completedAt: null,
      })
    }

    return submission
  }

  private async loadResources(repos: UnitOfWorkRepos, assistantTaskId: number, assistantTaskProductId: number) {
    const task = await repos.assistantTaskRepository.findById(assistantTaskId)
    if (!task) throw new NotFoundException('Công việc trợ giảng không tồn tại')

    const product = await repos.assistantTaskProductRepository.findById(assistantTaskProductId)
    if (!product) throw new NotFoundException('Sản phẩm trợ giảng không tồn tại')

    return { task, product }
  }

  private assertOwnerAccess(
    taskAssistantId: number | null,
    productAssistantId: number,
    ownerAssistantId?: number,
  ): void {
    if (ownerAssistantId === undefined) return
    if (productAssistantId !== ownerAssistantId || taskAssistantId !== ownerAssistantId) {
      throw new PermissionDeniedException(
        'Bạn chỉ được gắn hoặc gỡ sản phẩm của mình trên công việc được giao cho mình',
      )
    }
  }
}
