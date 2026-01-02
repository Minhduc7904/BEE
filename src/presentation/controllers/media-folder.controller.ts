import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import {
    CreateMediaFolderUseCase,
    GetMediaFolderUseCase,
    GetMediaFolderListUseCase,
    GetFolderChildrenUseCase,
    UpdateMediaFolderUseCase,
    DeleteMediaFolderUseCase,
} from '../../application/use-cases/media-folder'
import {
    CreateMediaFolderDto,
    UpdateMediaFolderDto,
    GetMediaFolderListDto,
    MediaFolderResponseDto,
} from '../../application/dtos/media-folder'
import { BaseResponseDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators'

@Controller('media-folders')
@AuthOnly()
export class MediaFolderController {
    constructor(
        private readonly createMediaFolderUseCase: CreateMediaFolderUseCase,
        private readonly getMediaFolderUseCase: GetMediaFolderUseCase,
        private readonly getMediaFolderListUseCase: GetMediaFolderListUseCase,
        private readonly getFolderChildrenUseCase: GetFolderChildrenUseCase,
        private readonly updateMediaFolderUseCase: UpdateMediaFolderUseCase,
        private readonly deleteMediaFolderUseCase: DeleteMediaFolderUseCase,
    ) { }

    /**
     * Create a new media folder
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createFolder(
        @Body() dto: CreateMediaFolderDto,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<MediaFolderResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.createMediaFolderUseCase.execute(dto, userId),
        )
    }

    /**
     * Get list of folders with optional filters
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async getFolderList(
        @Query() dto: GetMediaFolderListDto,
    ): Promise<
        BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getMediaFolderListUseCase.execute(dto),
        )
    }

    /**
     * Get root folders (parentId = null)
     */
    @Get('roots')
    @HttpCode(HttpStatus.OK)
    async getRootFolders(): Promise<
        BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getFolderChildrenUseCase.execute(null),
        )
    }

    /**
     * Get single folder by ID
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getFolder(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<MediaFolderResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getMediaFolderUseCase.execute(id),
        )
    }

    /**
     * Get direct children of a folder
     */
    @Get(':id/children')
    @HttpCode(HttpStatus.OK)
    async getFolderChildren(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<
        BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>
    > {
        return ExceptionHandler.execute(() =>
            this.getFolderChildrenUseCase.execute(id),
        )
    }

    /**
     * Update folder metadata
     */
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async updateFolder(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMediaFolderDto,
    ): Promise<BaseResponseDto<MediaFolderResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.updateMediaFolderUseCase.execute(id, dto),
        )
    }

    /**
     * Delete folder (cascade delete children and media)
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteFolder(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
        return ExceptionHandler.execute(() =>
            this.deleteMediaFolderUseCase.execute(id),
        )
    }
}
