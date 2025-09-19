import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CreateImageDto } from '../../dtos/image/create-image.dto'

export interface CreateImageUseCaseResponse {
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
export class CreateImageUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(data: CreateImageDto): Promise<BaseResponseDto<CreateImageUseCaseResponse>> {
    try {
      const result = await this.unitOfWork.executeInTransaction(async (repos) => {
        const image = await repos.imageRepository.create({
          url: data.url,
          anotherUrl: data.anotherUrl,
          mimeType: data.mimeType,
          storageProvider: data.storageProvider,
          adminId: data.adminId,
        })

        return {
          imageId: image.imageId,
          adminId: image.adminId,
          url: image.url,
          anotherUrl: image.anotherUrl,
          mimeType: image.mimeType,
          storageProvider: image.storageProvider,
          createdAt: image.createdAt,
          updatedAt: image.updatedAt,
        }
      })

      return {
        success: true,
        message: 'Image created successfully',
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create image',
        data: undefined,
      }
    }
  }
}
