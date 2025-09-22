import { Injectable, Inject } from '@nestjs/common'
import {
  DocumentResponseDto,
  BaseResponseDto,
} from '../../dtos'
import type { IDocumentRepository, IAdminRepository } from '../../../domain/repositories'
import type { IStorageService } from '../../../domain/interface/storage.interface'
import { getFileExtension, generateFileName } from '../../../shared/utils'
import {
  NotFoundException,
  BusinessLogicException
} from '../../../shared/exceptions/custom-exceptions'
import { StorageProvider } from '../../../shared/enums'

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject('IDocumentRepository') private readonly documentRepository: IDocumentRepository,
    @Inject('IStorageService') private readonly storageService: IStorageService,
    @Inject('IAdminRepository') private readonly adminRepository: IAdminRepository,
  ) { }

  async execute(
    file: Buffer,
    originalName: string,
    mimeType: string,
    adminId: number
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    const admin = await this.adminRepository.findById(adminId)
    if (!admin) {
      throw new NotFoundException('Admin không tồn tại')
    }
    const fileExtension = getFileExtension(originalName)
    const fileName = generateFileName(originalName, fileExtension)

    const uploadResult = await this.storageService.uploadFile(file, {
      fileName,
      folder: 'document',
      contentType: mimeType,
      upsert: true
    })

    let newDocument
    try {
      newDocument = await this.documentRepository.create({
        url: uploadResult.url,
        adminId: adminId,
        storageProvider: StorageProvider.SUPABASE,
        mimeType: mimeType
      })
    } catch (error) {
      await this.storageService.deleteFile(uploadResult.filePath)
      throw new BusinessLogicException('Lỗi up ảnh: ' + error)
    }

    const response = DocumentResponseDto.fromEntity(newDocument)

    return BaseResponseDto.success(
      'Tạo tài liệu thành công',
      response
    )

  }
}

