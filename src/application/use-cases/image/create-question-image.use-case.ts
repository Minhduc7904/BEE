import { Injectable, Inject } from '@nestjs/common'
import { CreateQuestionImageDto } from '../../dtos/image/create-question-image.dto'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class CreateQuestionImageUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateQuestionImageDto, adminId: number): Promise<BaseResponseDto<any>> {
    try {
      const result = await this.unitOfWork.executeInTransaction(async (repos) => {
        // Tạo question image mới
        const questionImage = await repos.questionImageRepository.create({
          url: dto.url,
          anotherUrl: dto.anotherUrl,
          mimeType: dto.mimeType,
          storageProvider: dto.storageProvider,
          relatedType: dto.relatedType,
          relatedId: dto.relatedId,
          adminId: adminId,
        })

        return questionImage
      })

      return BaseResponseDto.success('Tạo ảnh câu hỏi thành công', {
        imageId: result.imageId,
        url: result.url,
        mimeType: result.mimeType,
        storageProvider: result.storageProvider,
        createdAt: result.createdAt,
      })
    } catch (error) {
      throw error
    }
  }
}
