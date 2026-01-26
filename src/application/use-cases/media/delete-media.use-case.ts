import { Injectable, Inject } from '@nestjs/common'
import type { IMediaRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { BaseResponseDto } from '../../dtos'
import { NotFoundException, ConflictException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteMediaUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,

    private readonly minioService: MinioService,

    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
  ) {}

  /**
   * Xóa mềm media – đánh dấu trạng thái là DELETED
   * Cách an toàn mặc định, dữ liệu vẫn được giữ lại
   */
  async executeSoftDelete(mediaId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Không tìm thấy media với ID ${mediaId}`)
    }

    const existUsage = await this.mediaUsageRepository.exists(mediaId)
    if (existUsage) {
      throw new ConflictException('Media đang được sử dụng, không thể xóa')
    }

    await this.mediaRepository.softDelete(mediaId)

    return BaseResponseDto.success('Xóa media thành công', {
      deleted: true,
      message: 'Media đã được đánh dấu là đã xóa',
    })
  }

  /**
   * Xóa mềm media theo người dùng
   * Chỉ áp dụng cho media thuộc về người dùng hiện tại
   * Phù hợp với hệ thống đa tenant
   */
  async executeSoftDeleteByUser(mediaId: number, userId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Không tìm thấy media với ID ${mediaId}`)
    }

    if (media.uploadedBy !== userId) {
      throw new NotFoundException('Không tìm thấy media của người dùng này')
    }

    const existUsage = await this.mediaUsageRepository.exists(mediaId)
    if (existUsage) {
      throw new ConflictException('Media đang được sử dụng, không thể xóa')
    }

    await this.mediaRepository.softDelete(mediaId)

    return BaseResponseDto.success('Xóa media cho người dùng thành công', {
      deleted: true,
      message: 'Media đã được đánh dấu là đã xóa cho người dùng này',
    })
  }

  /**
   * Xóa cứng media – xóa vĩnh viễn khỏi hệ thống lưu trữ và cơ sở dữ liệu
   * ⚠️ CẢNH BÁO: Hành động này không thể hoàn tác
   */
  async executeHardDelete(mediaId: number) {
    const media = await this.mediaRepository.findById(mediaId)
    if (!media) {
      throw new NotFoundException(`Không tìm thấy media với ID ${mediaId}`)
    }

    // Xóa file vật lý trên MinIO trước
    await this.minioService.deleteFile(media.bucketName, media.objectKey)

    // Sau đó xóa bản ghi trong database
    // Việc dọn dẹp dữ liệu liên quan nên được xử lý bằng job nền
    await this.mediaRepository.hardDelete(mediaId)

    return BaseResponseDto.success('Xóa media vĩnh viễn thành công', {
      deleted: true,
      message: 'Media đã bị xóa vĩnh viễn khỏi hệ thống lưu trữ',
    })
  }
}
