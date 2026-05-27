import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TeacherProfileResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { Visibility } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { attachTeacherProfileDetailMediaUrls } from './teacher-profile-media.util'

@Injectable()
export class GetPublicSeoTeacherProfileBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(slug: string): Promise<BaseResponseDto<TeacherProfileResponseDto>> {
    const teacherProfile = await this.unitOfWork.executeInTransaction((repos) =>
      repos.teacherProfileRepository.findBySlug(slug),
    )

    if (!teacherProfile || teacherProfile.visibility !== Visibility.PUBLISHED) {
      throw new NotFoundException('Khong tim thay ho so giao vien')
    }

    const response = TeacherProfileResponseDto.fromEntity(teacherProfile)
    await attachTeacherProfileDetailMediaUrls(this.unitOfWork, this.minioService, response)

    return BaseResponseDto.success('Lay ho so giao vien thanh cong', response)
  }
}
