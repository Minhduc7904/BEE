import { Injectable, Inject } from '@nestjs/common'
import { CreateDocumentDto, DocumentResponseDto } from '../../dtos/document/document.dto'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EnumMapper } from '../../../shared/utils/enum-mapper.util'

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateDocumentDto, adminId?: number): Promise<BaseResponseDto<DocumentResponseDto>> {
    try {
      const result = await this.unitOfWork.executeInTransaction(async (repos) => {
        // Tạo document mới
        const document = await repos.documentRepository.create({
          description: dto.description,
          url: dto.url,
          anotherUrl: dto.anotherUrl,
          mimeType: dto.mimeType,
          subjectId: dto.subjectId,
          relatedType: dto.relatedType,
          relatedId: dto.relatedId,
          storageProvider: dto.storageProvider,
          adminId: dto.adminId || adminId,
        })

        return document
      })

      const responseData: DocumentResponseDto = {
        documentId: result.documentId,
        adminId: result.adminId || undefined,
        url: result.url,
        anotherUrl: result.anotherUrl || undefined,
        description: result.description || undefined,
        mimeType: result.mimeType || undefined,
        subjectId: result.subjectId || undefined,
        subject: result.getSubjectName ? result.getSubjectName() : result.subject?.name,
        relatedType: result.relatedType || undefined,
        relatedId: result.relatedId || undefined,
        storageProvider: result.storageProvider,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }

      return BaseResponseDto.success('Tạo document thành công', responseData)
    } catch (error) {
      throw error
    }
  }
}
