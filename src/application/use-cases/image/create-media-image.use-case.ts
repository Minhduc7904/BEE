import { Injectable, Inject } from '@nestjs/common'
import {
  MediaImageResponseDto,
  BaseResponseDto,
} from '../../dtos'
import type {
  IMediaImageRepository,
  IAdminRepository
} from '../../../domain/repositories'
import type { IStorageService } from '../../../domain/interface/storage.interface'
import { getFileExtension, generateFileName } from '../../../shared/utils'
import {
  NotFoundException,
  BusinessLogicException
} from '../../../shared/exceptions/custom-exceptions'
import { StorageProvider } from '../../../shared/enums'
import { MediaImageMapper } from '../../../infrastructure/mappers'

@Injectable()
export class CreateMediaImageUseCase {
  constructor(
    @Inject('IMediaImageRepository')
    private readonly mediaImageRepository: IMediaImageRepository,

    @Inject('IStorageService')
    private readonly storageService: IStorageService,

    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
  ) { }

  async execute(
    file: Buffer,
    originalName: string,
    mimeType: string,
    adminId: number
  ): Promise<BaseResponseDto<MediaImageResponseDto>> {
    const admin = await this.adminRepository.findById(adminId)
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại')
    }

    const fileExtension = getFileExtension(originalName)
    const fileName = generateFileName(originalName, fileExtension)

    const uploadResult = await this.storageService.uploadFile(file, {
      fileName,
      folder: 'media-image',
      contentType: mimeType,
      upsert: true,
    })

    let newMediaImage
    try {
      newMediaImage = await this.mediaImageRepository.create({
        url: uploadResult.url,
        adminId: adminId,
        storageProvider: StorageProvider.SUPABASE,
        mimeType: mimeType,
      })
    } catch (error) {
      await this.storageService.deleteFile(uploadResult.filePath)
      throw new BusinessLogicException('Lỗi upload ảnh media: ' + error)
    }

    const response = MediaImageResponseDto.fromEntity(newMediaImage)

    return BaseResponseDto.success(
      'Tạo ảnh media thành công',
      response,
    )
  }
}
