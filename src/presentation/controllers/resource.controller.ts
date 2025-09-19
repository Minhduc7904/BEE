import { Controller, Post, Body, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { CreateDocumentDto } from '../../application/dtos/document/document.dto'
import { CreateQuestionImageDto } from '../../application/dtos/image/create-question-image.dto'
import { CreateSolutionImageDto } from '../../application/dtos/image/create-solution-image.dto'
import { CreateMediaImageDto } from '../../application/dtos/image/create-media-image.dto'
import { CreateImageDto } from '../../application/dtos/image/create-image.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CreateDocumentUseCase } from '../../application/use-cases/document/create-document.use-case'
import { CreateQuestionImageUseCase } from '../../application/use-cases/image/create-question-image.use-case'
import { CreateSolutionImageUseCase } from '../../application/use-cases/image/create-solution-image.use-case'
import { CreateMediaImageUseCase } from '../../application/use-cases/image/create-media-image.use-case'
import { CreateImageUseCase } from '../../application/use-cases/image/create-image.use-case'

@ApiTags('Resources')
@Controller('resources')
export class ResourceController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly createQuestionImageUseCase: CreateQuestionImageUseCase,
    private readonly createSolutionImageUseCase: CreateSolutionImageUseCase,
    private readonly createMediaImageUseCase: CreateMediaImageUseCase,
    private readonly createImageUseCase: CreateImageUseCase,
  ) {}

  @Post('documents')
  @ApiOperation({
    summary: 'Tạo document mới',
    description: 'Tạo một document mới trong hệ thống (test - cần admin ID)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document đã được tạo thành công',
    type: BaseResponseDto,
  })
  async createDocument(@Body() dto: CreateDocumentDto): Promise<BaseResponseDto<any>> {
    // Test với adminId = 1, sau này sẽ lấy từ JWT token
    const adminId = 1

    return await this.createDocumentUseCase.execute(dto, adminId)
  }

  @Post('question-images')
  @ApiOperation({
    summary: 'Tạo ảnh câu hỏi mới',
    description: 'Tạo một ảnh câu hỏi mới trong hệ thống (test - cần admin ID)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ảnh câu hỏi đã được tạo thành công',
    type: BaseResponseDto,
  })
  async createQuestionImage(@Body() dto: CreateQuestionImageDto): Promise<BaseResponseDto<any>> {
    // Test với adminId = 1, sau này sẽ lấy từ JWT token
    const adminId = 1

    return await this.createQuestionImageUseCase.execute(dto, adminId)
  }

  @Post('solution-images')
  @ApiOperation({
    summary: 'Tạo ảnh lời giải mới',
    description: 'Tạo một ảnh lời giải mới trong hệ thống',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ảnh lời giải đã được tạo thành công',
    type: BaseResponseDto,
  })
  async createSolutionImage(@Body() dto: CreateSolutionImageDto): Promise<BaseResponseDto<any>> {
    return await this.createSolutionImageUseCase.execute(dto)
  }

  @Post('media-images')
  @ApiOperation({
    summary: 'Tạo ảnh media mới',
    description: 'Tạo một ảnh media mới trong hệ thống',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ảnh media đã được tạo thành công',
    type: BaseResponseDto,
  })
  async createMediaImage(@Body() dto: CreateMediaImageDto): Promise<BaseResponseDto<any>> {
    return await this.createMediaImageUseCase.execute(dto)
  }

  @Post('images')
  @ApiOperation({
    summary: 'Tạo ảnh mới',
    description: 'Tạo một ảnh mới trong hệ thống',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ảnh đã được tạo thành công',
    type: BaseResponseDto,
  })
  async createImage(@Body() dto: CreateImageDto): Promise<BaseResponseDto<any>> {
    return await this.createImageUseCase.execute(dto)
  }
}
