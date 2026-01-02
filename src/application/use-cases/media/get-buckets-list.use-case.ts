import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BaseResponseDto } from '../../dtos'

export interface BucketInfo {
  name: string
  label: string
  description: string
}

@Injectable()
export class GetBucketsListUseCase {
  constructor(
    private readonly configService: ConfigService,
  ) { }

  async execute() {
    const buckets = this.configService.get('minio.buckets')

    const bucketsList: BucketInfo[] = [
      {
        name: buckets.images,
        label: 'Hình ảnh',
        description: 'Lưu trữ các file ảnh (JPG, PNG, GIF, WebP, etc.)',
      },
      {
        name: buckets.videos,
        label: 'Video',
        description: 'Lưu trữ các file video (MP4, AVI, MOV, etc.)',
      },
      {
        name: buckets.audios,
        label: 'Âm thanh',
        description: 'Lưu trữ các file âm thanh (MP3, WAV, AAC, etc.)',
      },
      {
        name: buckets.documents,
        label: 'Tài liệu',
        description: 'Lưu trữ các file tài liệu (PDF, DOC, XLS, etc.)',
      },
      {
        name: buckets.others,
        label: 'Khác',
        description: 'Lưu trữ các file khác',
      },
    ]

    return BaseResponseDto.success(
      'Buckets list retrieved successfully',
      {
        data: bucketsList,
        total: bucketsList.length,
      }
    )
  }
}
