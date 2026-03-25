// src/application/use-cases/admin/get-admin-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IAdminRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { AdminResponseDto, BaseResponseDto } from '../../dtos'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { FIELD_NAMES } from '../../../shared/constants'
import { MediaStatus } from '../../../shared/enums'

@Injectable()
export class GetAdminProfileUseCase {
  constructor(
    @Inject('IAdminRepository') private readonly adminRepository: IAdminRepository,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) { }

  async execute(userId: number): Promise<BaseResponseDto<AdminResponseDto>> {
    // Tìm admin theo userId với đầy đủ thông tin user, roles và permissions
    console.log('Finding admin with userId:', userId)
    const admin = await this.adminRepository.findByUserId(userId)

    if (!admin) {
      throw new NotFoundException('Admin profile not found')
    }

    if (!admin.user?.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }
    // console.log('Admin found:', admin)
    // Mapper sẽ tự động xử lý việc lọc roles active và chưa expire
    // cũng như map permissions cho từng role
    const adminResponse = AdminResponseDto.fromUserWithAdmin(admin.user, admin)
    adminResponse.avatarUrl = undefined

    const avatarUsages = await this.mediaUsageRepository.findByEntity(
      EntityType.USER,
      userId,
      FIELD_NAMES.AVATAR,
    )

    if (avatarUsages.length > 0) {
      const avatarUsage = avatarUsages[0]
      const media = avatarUsage.media

      if (media && media.status === MediaStatus.READY) {
        try {
          const avatarUrl = await this.minioService.getPresignedUrl(
            media.bucketName,
            media.objectKey,
            3600 * 24,
          )
          adminResponse.avatarUrl = avatarUrl
        } catch (error) {
          // Silently ignore - avatar URL is optional
        }
      }
    }

    return BaseResponseDto.success(
      'Get admin profile successfully',
      adminResponse,
    )
  }
}
