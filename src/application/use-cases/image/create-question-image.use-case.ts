import { Injectable, Inject } from '@nestjs/common'
import {
  QuestionImageResponseDto,
  BaseResponseDto,
} from '../../dtos'
import type {
  IQuestionImageRepository,
  IAdminRepository
} from '../../../domain/repositories'
import type { IStorageService } from '../../../domain/interface/storage.interface'
import { getFileExtension, generateFileName } from '../../../shared/utils'
import {
  NotFoundException,
  BusinessLogicException
} from '../../../shared/exceptions/custom-exceptions'
import { StorageProvider } from '../../../shared/enums'
import { QuestionImageMapper } from '../../../infrastructure/mappers'

@Injectable()
export class CreateQuestionImageUseCase {
  constructor(
    @Inject('IQuestionImageRepository') private readonly questionImageRepository: IQuestionImageRepository,
    @Inject('IStorageService') private readonly storageService: IStorageService,
    @Inject('IAdminRepository') private readonly adminRepository: IAdminRepository,
  ) { }

  async execute(
    file: Buffer,
    originalName: string,
    mimeType: string,
    adminId: number
  ): Promise<BaseResponseDto<QuestionImageResponseDto>> {
    const admin = await this.adminRepository.findById(adminId)
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại')
    }
    const fileExtension = getFileExtension(originalName)
    const fileName = generateFileName(originalName, fileExtension)
    const uploadResult = await this.storageService.uploadFile(file, {
      fileName,
      folder: 'question-image',
      contentType: mimeType,
      upsert: true
    })

    let newQuestionImage
    try {
      newQuestionImage = await this.questionImageRepository.create({
        url: uploadResult.url,
        adminId: adminId,
        storageProvider: StorageProvider.SUPABASE,
        mimeType: mimeType
      })
    } catch (error) {
      await this.storageService.deleteFile(uploadResult.filePath)
      throw new BusinessLogicException('Lỗi up ảnh: ' + error)
    }

    const response = QuestionImageResponseDto.fromEntity(newQuestionImage)

    return BaseResponseDto.success(
      'Tạo ảnh câu hỏi thành công',
      response
    )
  }
}
