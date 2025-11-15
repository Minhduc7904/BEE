import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  UploadMediaUseCase,
  GetMediaUseCase,
  GetMediaListUseCase,
  UpdateMediaUseCase,
  DeleteMediaUseCase,
} from '../../application/use-cases'
import {
  UploadMediaDto,
  UpdateMediaDto,
  GetMediaListDto,
  MediaResponseDto,
} from '../../application/dtos/media'
import { BaseResponseDto } from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators'

@Controller('media')
@AuthOnly()
export class MediaController {
  constructor(
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly getMediaUseCase: GetMediaUseCase,
    private readonly getMediaListUseCase: GetMediaListUseCase,
    private readonly updateMediaUseCase: UpdateMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.uploadMediaUseCase.execute(file, userId, dto),
    )
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMediaList(
    @Query() dto: GetMediaListDto,
  ): Promise<BaseResponseDto<{ data: MediaResponseDto[]; total: number }>> {
    return ExceptionHandler.execute(() => this.getMediaListUseCase.execute(dto))
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getMedia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.getMediaUseCase.execute(id))
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMediaDto,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.updateMediaUseCase.execute(id, dto))
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMedia(
    @Param('id', ParseIntPipe) id: number,
    @Query('hard', ParseBoolPipe) hardDelete: boolean = false,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() =>
      this.deleteMediaUseCase.execute(id, hardDelete),
    )
  }
}
