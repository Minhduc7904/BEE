import { Injectable, Inject } from '@nestjs/common';
import { CreateDocumentDto, DocumentResponseDto } from '../../dtos/document/document.dto';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { BaseResponseDto } from '../../dtos/base-response.dto';
import { EnumMapper } from '../../../shared/utils/enum-mapper.util';

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
          subject: dto.subject,
          relatedType: dto.relatedType,
          relatedId: dto.relatedId,
          storageProvider: dto.storageProvider,
          adminId: dto.adminId || adminId,
        });

        return document;
      });

      const responseData: DocumentResponseDto = {
        documentId: result.documentId,
        adminId: result.adminId,
        url: result.url,
        anotherUrl: result.anotherUrl,
        description: result.description,
        mimeType: result.mimeType,
        subject: result.subject,
        relatedType: result.relatedType,
        relatedId: result.relatedId,
        storageProvider: result.storageProvider,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      return BaseResponseDto.success(
        'Tạo document thành công',
        responseData
      );
    } catch (error) {
      throw error;
    }
  }
}
