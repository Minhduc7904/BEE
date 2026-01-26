import { Inject, Injectable } from '@nestjs/common'
import type { IMediaUsageRepository } from '../../../domain/repositories'
import { GetMediaUsageListDto } from '../../dtos/media-usage'
import { BaseResponseDto } from '../../dtos/'
import { MediaUsageResponseDto } from '../../dtos/media-usage'
import { ConflictException } from 'src/shared/exceptions/custom-exceptions'
// GetMediaUsagesUseCase.ts
@Injectable()
export class GetMediaUsagesUseCase {
    constructor(
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
    ) { }

    async execute(dto: GetMediaUsageListDto) {
        if (!dto.mediaId || (!dto.entityId && !dto.entityType)) {
            throw new ConflictException('At least mediaId or entityId and entityType must be provided')
        }
        const usages = await this.mediaUsageRepository.findAll(dto)

        return BaseResponseDto.success('Media usages retrieved successfully', {
            data: usages.map(MediaUsageResponseDto.fromEntity),
            total: usages.length,
        })
    }
}
