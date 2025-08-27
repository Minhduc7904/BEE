import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from '../dtos/document/document.dto';
import type { IUnitOfWork } from '../../domain/repositories/unit-of-work.repository';
import { BaseResponseDto } from '../dtos/base-response.dto';
import { StorageProvider } from '../../constants/storage-provider.constant';

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateDocumentDto, adminId: number): Promise<BaseResponseDto<any>> {
    try {
      const result = await this.unitOfWork.executeInTransaction(async (repos) => {
        // Tạo document mới
        const document = await repos.documentRepository.create({
          description: dto.description,
          url: dto.sourceUrl,
          subject: dto.subject,
          relatedType: dto.relatedType,
          relatedId: dto.relatedId,
          storageProvider: StorageProvider.EXTERNAL, // Mặc định là EXTERNAL
          adminId: adminId,
        });

        return document;
      });

      return BaseResponseDto.success(
        'Tạo document thành công',
        {
          documentId: result.documentId,
          url: result.url,
          description: result.description,
          subject: result.subject,
          createdAt: result.createdAt
        }
      );
    } catch (error) {
      throw error;
    }
  }
}
