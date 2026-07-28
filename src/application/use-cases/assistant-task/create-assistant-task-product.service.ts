import { Injectable } from '@nestjs/common'

import type { UnitOfWorkRepos } from '../../../domain/repositories'
import { AssistantTaskProduct } from '../../../domain/entities/assistant-task'
import { NotFoundException, PermissionDeniedException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CreateAssistantTaskProductService {
  async create(
    repos: UnitOfWorkRepos,
    data: {
      assistantId: number
      examId: number
      name?: string | null
      quantity?: number | null
    },
  ): Promise<AssistantTaskProduct> {
    const assistant = await repos.adminRepository.findById(data.assistantId)
    if (!assistant) throw new NotFoundException('Trợ giảng không tồn tại')

    const exam = await repos.examRepository.findById(data.examId)
    if (!exam) throw new NotFoundException('Đề thi không tồn tại')
    if (exam.createdBy !== data.assistantId) {
      throw new PermissionDeniedException('Đề thi không được tạo bởi trợ giảng sở hữu sản phẩm')
    }

    return repos.assistantTaskProductRepository.create({
      assistantId: data.assistantId,
      examId: data.examId,
      name: data.name === undefined ? exam.title : data.name,
      quantity: data.quantity,
    })
  }
}
