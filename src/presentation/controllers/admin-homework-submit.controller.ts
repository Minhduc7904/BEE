import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common'
import {
  AdminHomeworkSubmitDetailDto,
  GradeStudentFileHomeworkDto,
  UpdateHomeworkSubmitImageAltDto,
} from '../../application/dtos/homeworkSubmit'
import {
  GetAdminHomeworkSubmitDetailUseCase,
  GradeStudentFileHomeworkUseCase,
  UpdateHomeworkSubmitImageAltUseCase,
  UngradeStudentFileHomeworkUseCase,
} from '../../application/use-cases/homeworkSubmit'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { MediaResponseDto } from '../../application/dtos/media/media-response.dto'
import { HomeworkSubmitResponseDto } from '../../application/dtos/homeworkSubmit/homework-submit.dto'
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/homework-submissions')
export class AdminHomeworkSubmitController {
  constructor(
    private readonly getAdminHomeworkSubmitDetailUseCase: GetAdminHomeworkSubmitDetailUseCase,
    private readonly gradeStudentFileHomeworkUseCase: GradeStudentFileHomeworkUseCase,
    private readonly updateHomeworkSubmitImageAltUseCase: UpdateHomeworkSubmitImageAltUseCase,
    private readonly ungradeStudentFileHomeworkUseCase: UngradeStudentFileHomeworkUseCase,
  ) {}

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('id', ParseIntPipe) homeworkSubmitId: number,
  ): Promise<BaseResponseDto<AdminHomeworkSubmitDetailDto>> {
    return ExceptionHandler.execute(() =>
      this.getAdminHomeworkSubmitDetailUseCase.execute(homeworkSubmitId),
    )
  }

  @Patch(':id/grade')
  @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GRADE)
  @HttpCode(HttpStatus.OK)
  async gradeFileHomework(
    @Param('id', ParseIntPipe) homeworkSubmitId: number,
    @Body() dto: GradeStudentFileHomeworkDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() =>
      this.gradeStudentFileHomeworkUseCase.execute(homeworkSubmitId, dto, adminId),
    )
  }

  @Patch(':id/media/:mediaId/alt')
  @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GRADE)
  @HttpCode(HttpStatus.OK)
  async updateImageAlt(
    @Param('id', ParseIntPipe) homeworkSubmitId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Body() dto: UpdateHomeworkSubmitImageAltDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.updateHomeworkSubmitImageAltUseCase.execute(
        homeworkSubmitId,
        mediaId,
        dto,
        adminId,
      ),
    )
  }

  @Patch(':id/ungrade')
  @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GRADE)
  @HttpCode(HttpStatus.OK)
  async ungradeFileHomework(
    @Param('id', ParseIntPipe) homeworkSubmitId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.ungradeStudentFileHomeworkUseCase.execute(homeworkSubmitId, adminId),
    )
  }
}
