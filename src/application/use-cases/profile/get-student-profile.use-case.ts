// src/application/use-cases/profile/get-student-profile.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IStudentRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { StudentResponseDto, BaseResponseDto } from '../../dtos'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { FIELD_NAMES } from '../../../shared/constants'
import { MediaStatus } from '../../../shared/enums'

@Injectable()
export class GetStudentProfileUseCase {
  constructor(
    @Inject('IStudentRepository') private readonly studentRepository: IStudentRepository,
    @Inject('IMediaUsageRepository') private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(userId: number): Promise<BaseResponseDto<StudentResponseDto>> {
    // Tìm student theo userId với đầy đủ thông tin user, roles và permissions
    const student = await this.studentRepository.findByUserId(userId)
    
    if (!student) {
      throw new NotFoundException('Student profile not found')
    }

    // Mapper sẽ tự động xử lý việc lọc roles active và chưa expire
    // cũng như map permissions cho từng role
    const studentResponse = StudentResponseDto.fromUserWithStudent(student.user, student)
    studentResponse.avatarUrl = undefined // Đặt mặc định là undefined, sẽ cập nhật nếu tìm thấy avatar media
    // Tìm media usage có entity là USER và fieldName là avatar
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
            3600 * 24, // 1 hour expiry
          )
          studentResponse.avatarUrl = avatarUrl
        } catch (error) {
          // Silently ignore - avatar URL is optional
        }
      }
    }

    return BaseResponseDto.success(
      'Get student profile successfully',
      studentResponse,
    )
  }
}
