import { Injectable, Inject } from '@nestjs/common';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';
import { CreateSolutionImageDto } from '../../dtos/image/create-solution-image.dto';

export interface CreateSolutionImageUseCaseResponse {
  imageId: number;
  adminId?: number;
  url: string;
  anotherUrl?: string;
  mimeType?: string;
  storageProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateSolutionImageUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(data: CreateSolutionImageDto): Promise<BaseResponseDto<CreateSolutionImageUseCaseResponse>> {
    try {
      const result = await this.unitOfWork.executeInTransaction(async (repos) => {
        const solutionImage = await repos.solutionImageRepository.create({
          url: data.url,
          anotherUrl: data.anotherUrl,
          mimeType: data.mimeType,
          storageProvider: data.storageProvider,
          adminId: data.adminId,
        });

        return {
          imageId: solutionImage.imageId,
          adminId: solutionImage.adminId,
          url: solutionImage.url,
          anotherUrl: solutionImage.anotherUrl,
          mimeType: solutionImage.mimeType,
          storageProvider: solutionImage.storageProvider,
          createdAt: solutionImage.createdAt,
          updatedAt: solutionImage.updatedAt,
        };
      });

      return {
        success: true,
        message: 'Solution image created successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create solution image',
        data: undefined,
      };
    }
  }
}
