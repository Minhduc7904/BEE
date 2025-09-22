import { Injectable, Inject } from '@nestjs/common'
import {
  ImageResponseDto,
  BaseResponseDto,
} from '../../dtos'
import type {
  IImageRepository,
  IAdminRepository
} from '../../../domain/repositories'
import type { IStorageService } from '../../../domain/interface/storage.interface'
import { getFileExtension, generateFileName } from '../../../shared/utils'
import {
  NotFoundException,
  BusinessLogicException
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CreateImageUseCase {
  constructor(
    @Inject('IImageRepository')
    private readonly imageRepository: IImageRepository,

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
  ): Promise<BaseResponseDto<ImageResponseDto>> {
    const admin = await this.adminRepository.findById(adminId)
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại')
    }

    const fileExtension = getFileExtension(originalName)
    const fileName = generateFileName(originalName, fileExtension)

    const uploadResult = await this.storageService.uploadFile(file, {
      fileName,
      folder: 'image',
      contentType: mimeType,
      upsert: true,
    })

    let newImage
    try {
      newImage = await this.imageRepository.create({
        url: uploadResult.url,
        adminId: adminId,
        storageProvider: uploadResult.storageProvider,
        mimeType: mimeType,
      })
    } catch (error) {
      await this.storageService.deleteFile(uploadResult.filePath)
      throw new BusinessLogicException('Lỗi upload ảnh: ' + error)
    }

    const response = ImageResponseDto.fromEntity(newImage)

    return BaseResponseDto.success(
      'Tạo ảnh thành công',
      response,
    )
  }
}
