import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiConsumes
} from '@nestjs/swagger'
import {
  BaseResponseDto,
  DocumentResponseDto,
  QuestionImageResponseDto,
  SolutionImageResponseDto,
  MediaImageResponseDto,
  ImageResponseDto
} from '../../application/dtos'
import {
  CreateImageUseCase,
  CreateMediaImageUseCase,
  CreateSolutionImageUseCase,
  CreateQuestionImageUseCase,
  CreateDocumentUseCase
} from '../../application/use-cases'
import { AdminOnly, CurrentUser, ValidatedImageFile, ValidatedPdfDocFile } from '../../shared/decorators'
import { FileInterceptor } from '@nestjs/platform-express'

@ApiTags('Resources')
@Controller('resources')
export class ResourceController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly createQuestionImageUseCase: CreateQuestionImageUseCase,
    private readonly createSolutionImageUseCase: CreateSolutionImageUseCase,
    private readonly createMediaImageUseCase: CreateMediaImageUseCase,
    private readonly createImageUseCase: CreateImageUseCase,
  ) { }

  @Post('documents')
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Tạo document mới',
    description: 'Tạo một document mới trong hệ thống (test - cần admin ID)',
  })
  @ApiConsumes('multipart/form-data')
  async createDocument(
    @ValidatedPdfDocFile() file: Express.Multer.File,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    return await this.createDocumentUseCase.execute(
      file.buffer,
      file.originalname,
      file.mimetype,
      adminId
    )
  }

  @Post('question-images')
  @ApiOperation({
    summary: 'Tạo ảnh câu hỏi mới',
    description: 'Tạo một ảnh câu hỏi mới trong hệ thống',
  })
  @UseInterceptors(FileInterceptor('image'))
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  async createQuestionImage(
    @ValidatedImageFile() file: Express.Multer.File,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<QuestionImageResponseDto>> {
    return await this.createQuestionImageUseCase.execute(
      file.buffer,
      file.originalname,
      file.mimetype,
      adminId
    )
  }

  @Post('solution-images')
  @ApiOperation({
    summary: 'Tạo ảnh lời giải mới',
    description: 'Tạo một ảnh lời giải mới trong hệ thống',
  })
  @UseInterceptors(FileInterceptor('image'))
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  async createSolutionImage(
    @ValidatedImageFile() file: Express.Multer.File,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<SolutionImageResponseDto>> {
    return await this.createSolutionImageUseCase.execute(
      file.buffer,
      file.originalname,
      file.mimetype,
      adminId,
    )
  }


  @Post('media-images')
  @ApiOperation({
    summary: 'Tạo ảnh media mới',
    description: 'Tạo một ảnh media mới trong hệ thống',
  })
  @UseInterceptors(FileInterceptor('image'))
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  async createMediaImage(
    @ValidatedImageFile() file: Express.Multer.File,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<MediaImageResponseDto>> {
    return await this.createMediaImageUseCase.execute(
      file.buffer,
      file.originalname,
      file.mimetype,
      adminId,
    )
  }


  @Post('images')
  @ApiOperation({
    summary: 'Tạo ảnh mới',
    description: 'Tạo một ảnh mới trong hệ thống',
  })
  @UseInterceptors(FileInterceptor('image'))
  @AdminOnly()
  @ApiConsumes('multipart/form-data')
  async createImage(
    @ValidatedImageFile() file: Express.Multer.File,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ImageResponseDto>> {
    return await this.createImageUseCase.execute(
      file.buffer,
      file.originalname,
      file.mimetype,
      adminId,
    )
  }

}
