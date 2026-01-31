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
    Injectable,
} from '@nestjs/common'
import {
    AttachMediaUseCase,
    DetachMediaUseCase,
    DetachMediaByEntityUseCase,
    GetMediaUsagesByMediaUseCase,
    GetMediaUsagesByEntityUseCase,
    GetMediaUsagesUseCase,
} from '../../application/use-cases/media-usage'
import {
    AttachMediaDto,
    GetMediaUsageListDto,
    MediaUsageResponseDto,
} from '../../application/dtos/media-usage'
import { BaseResponseDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { EntityType } from 'src/shared/constants/entity-type.constants'

@Injectable()
@Controller('media-usages')
export class MediaUsageController {
    constructor(
        private readonly attachMediaUseCase: AttachMediaUseCase,
        private readonly detachMediaUseCase: DetachMediaUseCase,
        private readonly detachMediaByEntityUseCase: DetachMediaByEntityUseCase,
        private readonly getMediaUsagesByMediaUseCase: GetMediaUsagesByMediaUseCase,
        private readonly getMediaUsagesByEntityUseCase: GetMediaUsagesByEntityUseCase,
        private readonly getMediaUsagesUseCase: GetMediaUsagesUseCase,
    ) { }

    /**
     * Attach media to an entity
     * Creates a MediaUsage record linking media to entity
     */
    @Post('attach')
    @RequirePermission(PERMISSION_CODES.MEDIA_USAGE_ATTACH)
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
    @RequirePermission(PERMISSION_CODES.MEDIA_USAGE_GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getMediaUsages(
        @Query() dto: GetMediaUsageListDto,
    ): Promise<
        BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getMediaUsagesUseCase.execute(dto),
        )
    }

    /**
     * Get all usages of a specific media
     * Useful for checking where a media file is used before deletion
     */
    @Get('by-media/:mediaId')
    @RequirePermission(PERMISSION_CODES.MEDIA_USAGE_GET_BY_MEDIA)
    @HttpCode(HttpStatus.OK)
    async getMediaUsagesByMedia(
        @Param('mediaId', ParseIntPipe) mediaId: number,
        @CurrentUser('userId') userId: number,
    ): Promise<
        BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getMediaUsagesByMediaUseCase.execute(mediaId, userId),
        )
    }

    /**
     * Get all media attached to a specific entity
     * Example: GET /media-usages/by-entity/USER/123?fieldName=avatar
     */
    @Get('by-entity/:entityType/:entityId')
    @RequirePermission(PERMISSION_CODES.MEDIA_USAGE_GET_BY_ENTITY)
    @HttpCode(HttpStatus.OK)
    async getMediaUsagesByEntity(
        @Param('entityType') entityType: EntityType,
        @Param('entityId', ParseIntPipe) entityId: number,
        @Query('fieldName') fieldName?: string,
        @CurrentUser('userId') userId?: number,
    ): Promise<
        BaseResponseDto<{ data: MediaUsageResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getMediaUsagesByEntityUseCase.execute({
                entityType,
                entityId,
                fieldName,
            }, userId),
        )
    }

    /**
     * Detach media by usage ID
     * Removes a specific MediaUsage record
     */
    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.MEDIA_USAGE_DETACH)
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
    @RequirePermission(PERMISSION_CODES.MEDIA_USAGE_DETACH)
    @HttpCode(HttpStatus.OK)
    async detachMediaByEntity(
        @Param('entityType') entityType: EntityType,
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
