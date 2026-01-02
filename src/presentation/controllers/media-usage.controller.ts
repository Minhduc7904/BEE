import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import {
    AttachMediaUseCase,
    DetachMediaUseCase,
    DetachMediaByEntityUseCase,
    GetMediaUsagesByMediaUseCase,
    GetMediaUsagesByEntityUseCase,
} from '../../application/use-cases/media-usage'
import {
    AttachMediaDto,
    GetMediaUsageListDto,
    MediaUsageResponseDto,
} from '../../application/dtos/media-usage'
import { BaseResponseDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators'

@Controller('media-usages')
@AuthOnly()
export class MediaUsageController {
    constructor(
        private readonly attachMediaUseCase: AttachMediaUseCase,
        private readonly detachMediaUseCase: DetachMediaUseCase,
        private readonly detachMediaByEntityUseCase: DetachMediaByEntityUseCase,
        private readonly getMediaUsagesByMediaUseCase: GetMediaUsagesByMediaUseCase,
        private readonly getMediaUsagesByEntityUseCase: GetMediaUsagesByEntityUseCase,
    ) { }

    /**
     * Attach media to an entity
     * Creates a MediaUsage record linking media to entity
     */
    @Post('attach')
    @HttpCode(HttpStatus.CREATED)
    async attachMedia(
        @Body() dto: AttachMediaDto,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<MediaUsageResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.attachMediaUseCase.execute(dto, userId),
        )
    }

    /**
     * Get all media usages (with optional filters)
     * Can filter by mediaId, entityType, entityId, or fieldName
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async getMediaUsages(
        @Query() dto: GetMediaUsageListDto,
    ): Promise<
        BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>
    > {
        // Route to appropriate use case based on filters
        if (dto.mediaId) {
            return ExceptionHandler.execute(() =>
                this.getMediaUsagesByMediaUseCase.execute(dto.mediaId!),
            )
        }

        if (dto.entityType && dto.entityId) {
            return ExceptionHandler.execute(() =>
                this.getMediaUsagesByEntityUseCase.execute(dto),
            )
        }

        // No filters provided
        return BaseResponseDto.success('Please provide mediaId or entityType+entityId', {
            data: [],
            total: 0,
        })
    }

    /**
     * Get all usages of a specific media
     * Useful for checking where a media file is used before deletion
     */
    @Get('by-media/:mediaId')
    @HttpCode(HttpStatus.OK)
    async getMediaUsagesByMedia(
        @Param('mediaId', ParseIntPipe) mediaId: number,
    ): Promise<
        BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getMediaUsagesByMediaUseCase.execute(mediaId),
        )
    }

    /**
     * Get all media attached to a specific entity
     * Example: GET /media-usages/by-entity/USER/123?fieldName=avatar
     */
    @Get('by-entity/:entityType/:entityId')
    @HttpCode(HttpStatus.OK)
    async getMediaUsagesByEntity(
        @Param('entityType') entityType: string,
        @Param('entityId', ParseIntPipe) entityId: number,
        @Query('fieldName') fieldName?: string,
    ): Promise<
        BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getMediaUsagesByEntityUseCase.execute({
                entityType,
                entityId,
                fieldName,
            }),
        )
    }

    /**
     * Detach media by usage ID
     * Removes a specific MediaUsage record
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async detachMedia(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
        return ExceptionHandler.execute(() => this.detachMediaUseCase.execute(id))
    }

    /**
     * Detach all media from a specific entity
     * Example: DELETE /media-usages/by-entity/USER/123?fieldName=avatar
     */
    @Delete('by-entity/:entityType/:entityId')
    @HttpCode(HttpStatus.OK)
    async detachMediaByEntity(
        @Param('entityType') entityType: string,
        @Param('entityId', ParseIntPipe) entityId: number,
        @Query('fieldName') fieldName?: string,
    ): Promise<
        BaseResponseDto<{ deleted: boolean; count: number; message: string }>
    > {
        return ExceptionHandler.execute(() =>
            this.detachMediaByEntityUseCase.execute(entityType, entityId, fieldName),
        )
    }
}
