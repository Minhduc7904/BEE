import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { MediaResponseDto } from '../../dtos/media/media-response.dto'
import { UploadMediaUseCase } from '../media/upload-media.use-case'

@Injectable()
export class UploadStudentHomeworkFilesUseCase {
  constructor(
    private readonly uploadMediaUseCase: UploadMediaUseCase,
  ) {}

  async execute(
    files: Express.Multer.File[],
    userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto[]>> {
    const uploads = await Promise.all(
      files.map((file) => this.uploadMediaUseCase.execute(file, userId)),
    )

    return BaseResponseDto.success(
      'Tải file bài tập thành công',
      uploads.map((upload) => upload.data!),
    )
  }
}
