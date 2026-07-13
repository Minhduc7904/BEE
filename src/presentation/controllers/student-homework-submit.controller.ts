import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import {
  ResubmitStudentFileHomeworkDto,
  SubmitStudentFileHomeworkDto,
} from '../../application/dtos/homeworkSubmit/student-file-homework-submit.dto'
import { HomeworkSubmitResponseDto } from '../../application/dtos/homeworkSubmit/homework-submit.dto'
import { HomeworkSubmitListQueryDto } from '../../application/dtos/homeworkSubmit/homework-submit-list-query.dto'
import { MediaResponseDto } from '../../application/dtos/media/media-response.dto'
import {
  SubmitStudentFileHomeworkUseCase,
  UploadStudentHomeworkFilesUseCase,
  GetMyHomeworkSubmitsUseCase,
} from '../../application/use-cases/homeworkSubmit'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { FilesSizeByRoleInterceptor } from '../../shared/interceptors/files-size-by-role.interceptor'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('student/homework-submissions')
export class StudentHomeworkSubmitController {
  constructor(
    private readonly uploadStudentHomeworkFilesUseCase: UploadStudentHomeworkFilesUseCase,
    private readonly submitStudentFileHomeworkUseCase: SubmitStudentFileHomeworkUseCase,
    private readonly getMyHomeworkSubmitsUseCase: GetMyHomeworkSubmitsUseCase,
  ) {}

  @Get()
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getMySubmits(
    @Query() query: HomeworkSubmitListQueryDto,
    @CurrentUser('studentId') studentId: number,
    @CurrentUser('userId') userId: number,
  ) {
    return ExceptionHandler.execute(() =>
      this.getMyHomeworkSubmitsUseCase.execute(studentId, userId, query),
    )
  }

  @Post('files')
  @RequirePermission()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
    FilesSizeByRoleInterceptor,
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto[]>> {
    return ExceptionHandler.execute(() =>
      this.uploadStudentHomeworkFilesUseCase.execute(files, userId),
    )
  }

  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Body() dto: SubmitStudentFileHomeworkDto,
    @CurrentUser('studentId') studentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.submitStudentFileHomeworkUseCase.execute(dto, studentId, userId),
    )
  }

  @Put(':homeworkContentId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async resubmit(
    @Param('homeworkContentId', ParseIntPipe) homeworkContentId: number,
    @Body() dto: ResubmitStudentFileHomeworkDto,
    @CurrentUser('studentId') studentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.submitStudentFileHomeworkUseCase.resubmit(
        homeworkContentId,
        dto,
        studentId,
        userId,
      ),
    )
  }
}
