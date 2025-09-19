import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CreateMediaImageDto } from '../../dtos/image/create-media-image.dto'

export interface CreateMediaImageUseCaseResponse {
  imageId: number
  adminId?: number
  url: string
  anotherUrl?: string
  mimeType?: string
  storageProvider: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class CreateMediaImageUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(data: CreateMediaImageDto): Promise<BaseResponseDto<CreateMediaImageUseCaseResponse>> {
    try {
      const result = await this.unitOfWork.executeInTransaction(async (repos) => {
        const mediaImage = await repos.mediaImageRepository.create({
          url: data.url,
          anotherUrl: data.anotherUrl,
          mimeType: data.mimeType,
          storageProvider: data.storageProvider,
          adminId: data.adminId,
        })

        return {
          imageId: mediaImage.imageId,
          adminId: mediaImage.adminId,
          url: mediaImage.url,
          anotherUrl: mediaImage.anotherUrl,
          mimeType: mediaImage.mimeType,
          storageProvider: mediaImage.storageProvider,
          createdAt: mediaImage.createdAt,
          updatedAt: mediaImage.updatedAt,
        }
      })

      return {
        success: true,
        message: 'Media image created successfully',
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create media image',
        data: undefined,
      }
    }
  }
}
