import { Injectable, Inject } from '@nestjs/common'
import {
  SolutionImageResponseDto,
  BaseResponseDto,
} from '../../dtos'
import type {
  ISolutionImageRepository,
  IAdminRepository
} from '../../../domain/repositories'
import type { IStorageService } from '../../../domain/interface/storage.interface'
import { getFileExtension, generateFileName } from '../../../shared/utils'
import {
  NotFoundException,
  BusinessLogicException
} from '../../../shared/exceptions/custom-exceptions'
import { StorageProvider } from '../../../shared/enums'
import { SolutionImageMapper } from '../../../infrastructure/mappers'

@Injectable()
export class CreateSolutionImageUseCase {
  constructor(
    @Inject('ISolutionImageRepository')
    private readonly solutionImageRepository: ISolutionImageRepository,

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
  ): Promise<BaseResponseDto<SolutionImageResponseDto>> {
    const admin = await this.adminRepository.findById(adminId)
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại')
    }

    const fileExtension = getFileExtension(originalName)
    const fileName = generateFileName(originalName, fileExtension)

    const uploadResult = await this.storageService.uploadFile(file, {
      fileName,
      folder: 'solution-image',
      contentType: mimeType,
      upsert: true,
    })

    let newSolutionImage
    try {
      newSolutionImage = await this.solutionImageRepository.create({
        url: uploadResult.url,
        adminId: adminId,
        storageProvider: StorageProvider.SUPABASE,
        mimeType: mimeType,
      })
    } catch (error) {
      await this.storageService.deleteFile(uploadResult.filePath)
      throw new BusinessLogicException('Lỗi upload ảnh lời giải: ' + error)
    }

    const response = SolutionImageResponseDto.fromEntity(newSolutionImage)

    return BaseResponseDto.success(
      'Tạo ảnh lời giải thành công',
      response,
    )
  }
}
