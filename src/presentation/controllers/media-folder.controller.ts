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
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators'
import { MediaType } from 'src/shared/enums'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('media-folders')
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
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createFolder(
    @Body() dto: CreateMediaFolderDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaFolderResponseDto>> {
    return ExceptionHandler.execute(() => this.createMediaFolderUseCase.execute(dto, userId))
  }

  /**
   * Get list of folders with optional filters
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.VIEW)
  @HttpCode(HttpStatus.OK)
  async getFolderList(
    @Query() dto: GetMediaFolderListDto,
  ): Promise<BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>> {
    return ExceptionHandler.execute(() => this.getMediaFolderListUseCase.execute(dto))
  }

  /**
   * Get root folders (parentId = null)
   */
  @Get('roots')
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.VIEW)
  @HttpCode(HttpStatus.OK)
  async getRootFolders(
    @CurrentUser('userId') userId: number,
    @Query('type') type?: MediaType,
  ): Promise<BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>> {
    return ExceptionHandler.execute(() => this.getFolderChildrenUseCase.execute(null, userId, type))
  }

  /**
   * Get single folder by ID
   */
  @Get(':id')
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.VIEW)
  @HttpCode(HttpStatus.OK)
  async getFolder(@Param('id', ParseIntPipe) id: number, @CurrentUser('userId') userId: number): Promise<BaseResponseDto<MediaFolderResponseDto>> {
    return ExceptionHandler.execute(() => this.getMediaFolderUseCase.execute(id, userId))
  }

  /**
   * Get direct children of a folder
   */
  @Get(':id/children')
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.VIEW)
  @HttpCode(HttpStatus.OK)
  async getFolderChildren(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Query('type') type?: MediaType,
  ): Promise<BaseResponseDto<{ data: MediaFolderResponseDto[]; total: number }>> {
    return ExceptionHandler.execute(() => this.getFolderChildrenUseCase.execute(id, userId, type))
  }

  /**
   * Update folder metadata
   */
  @Put(':id')
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateFolder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateMediaFolderDto,
  ): Promise<BaseResponseDto<MediaFolderResponseDto>> {
    return ExceptionHandler.execute(() => this.updateMediaFolderUseCase.execute(id, dto, userId))
  }

  /**
   * Delete folder (cascade delete children and media)
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.MEDIA_FOLDER.DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteFolder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteMediaFolderUseCase.execute(id, userId))
  }
}
