// src/presentation/controllers/learning-item.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Req,
  Res,
  StreamableFile,
  Header,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { LearningItemListQueryDto } from '../../application/dtos/learningItem/learning-item-list-query.dto'
import { StudentHomeworkQueryDto } from '../../application/dtos/learningItem/student-homework-query.dto'
import { CreateLearningItemDto } from '../../application/dtos/learningItem/create-learning-item.dto'
import { UpdateLearningItemDto } from '../../application/dtos/learningItem/update-learning-item.dto'
import {
  LearningItemListResponseDto,
  LearningItemResponseDto,
} from '../../application/dtos/learningItem/learning-item.dto'
import { StudentHomeworkListResponseDto } from '../../application/dtos/learningItem/student-homework.dto'
import { StudentLearningItemResponseDto } from '../../application/dtos/learningItem/student-learning-item.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
  GetAllLearningItemUseCase,
  GetLearningItemByIdUseCase,
  GetStudentLearningItemByIdUseCase,
  CreateLearningItemUseCase,
  UpdateLearningItemUseCase,
  DeleteLearningItemUseCase,
  GetStudentHomeworksUseCase,
  StreamStudentVideoUseCase,
} from '../../application/use-cases/learningItem'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'
import { VideoStreamAuthGuard } from '../../shared/guards/video-stream-auth.guard'

@Injectable()
@Controller('learning-items')
export class LearningItemController {
  constructor(
    private readonly getAllLearningItemUseCase: GetAllLearningItemUseCase,
    private readonly getLearningItemByIdUseCase: GetLearningItemByIdUseCase,
    private readonly getStudentLearningItemByIdUseCase: GetStudentLearningItemByIdUseCase,
    private readonly createLearningItemUseCase: CreateLearningItemUseCase,
    private readonly updateLearningItemUseCase: UpdateLearningItemUseCase,
    private readonly deleteLearningItemUseCase: DeleteLearningItemUseCase,
    private readonly getStudentHomeworksUseCase: GetStudentHomeworksUseCase,
    private readonly streamStudentVideoUseCase: StreamStudentVideoUseCase,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllLearningItems(@Query() query: LearningItemListQueryDto): Promise<LearningItemListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllLearningItemUseCase.execute(query))
  }

  @Get('admin/my')
  @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.GET_MY_LEARNING_ITEMS)
  @HttpCode(HttpStatus.OK)
  async getMyLearningItems(
    @Query() query: LearningItemListQueryDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<LearningItemListResponseDto> {
    query.createdBy = adminId
    return ExceptionHandler.execute(() => this.getAllLearningItemUseCase.execute(query))
  }

  /**
   * Endpoint: GET /api/learning-items/student/my-homeworks
   *
   * Header:
   * - Authorization: Bearer <JWT của học sinh>.
   * - studentId và userId luôn lấy từ JWT, không nhận từ query.
   *
   * Query:
   * - page?: number, mặc định 1.
   * - limit?: number, mặc định 10, tối đa 100.
   * - search?: string, tìm theo title hoặc description của learning item.
   * - courseId?: number, lọc course mà học sinh có enrollment ACTIVE.
   * - lessonId?: number, lọc lesson học sinh được phép xem qua class.
   * - status?: ALL | INCOMPLETE | COMPLETED | OVERDUE, mặc định ALL.
   *   - INCOMPLETE: chưa có HomeworkSubmit của học sinh.
   *   - COMPLETED: đã có HomeworkSubmit của học sinh.
   *   - OVERDUE:
   *     FILE_UPLOAD quá hạn khi dueDate của homework đã hết;
   *     COMPETITION quá hạn khi dueDate của homework hoặc endDate của competition đã hết.
   *     Deadline null nghĩa là không giới hạn thời gian.
   * - homeworkType?: COMPETITION | FILE_UPLOAD; bỏ trống để lấy cả hai loại.
   * - sortBy?: createdAt | updatedAt | title, mặc định createdAt.
   * - sortOrder?: asc | desc, mặc định desc.
   *
   * Quyền xem:
   * - Chỉ lấy homework thuộc course có enrollment ACTIVE.
   * - Lesson phải PUBLISHED và phải đi qua cấu hình hiển thị của class.
   *
   * Response:
   * - data[]: learningItemId, title, description, type, createdAt, updatedAt,
   *   isLearned, learnedAt, lessonId, lessonTitle, courseId, homeworkContents[].
   * - homeworkContents[]: type, content, deadline, competition, trạng thái nộp bài
   *   và homeworkSubmit hiện tại của học sinh.
   * - Với FILE_UPLOAD, homeworkSubmit chỉ trả thông tin bài nộp;
   *   không trả mediaIds, attachments hoặc metadata/URL file.
   * - Với COMPETITION, competition chứa cấu hình cuộc thi và
   *   homeworkSubmit.competitionSubmitId liên kết lượt làm bài nếu đã nộp.
   * - meta: page, limit, total, totalPages, hasPrevious, hasNext.
   *
   * Ví dụ:
   * GET /api/learning-items/student/my-homeworks?homeworkType=FILE_UPLOAD&status=INCOMPLETE&page=1&limit=10
   */
  @Get('student/my-homeworks')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getMyHomeworks(
    @Query() query: StudentHomeworkQueryDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<StudentHomeworkListResponseDto> {
    return ExceptionHandler.execute(() => this.getStudentHomeworksUseCase.execute(studentId, query))
  }

  /**
   * Get a single learning item by ID (for student)
   * GET /learning-items/:id/student
   *
   * Rule:
   * - Learning item phải tồn tại.
   * - Learning item phải được gắn với ít nhất một lesson có visibility = PUBLISHED.
   * - Student phải có enrollment ACTIVE trong course của lesson public đó.
   * - Learning item chỉ thuộc lesson DRAFT hoặc PRIVATE sẽ không được trả về.
   *
   * Input:
   * - Request: `GET /api/learning-items/6667/student`.
   * - Header: `Authorization: Bearer <student-jwt>`.
   * - Path param `id`: ID learning item, ví dụ `6667`.
   * - Không có request body. `studentId` luôn lấy từ JWT, không nhận từ client.
   *
   * Output:
   * - Response trả về `BaseResponseDto<StudentLearningItemResponseDto>`:
   * ```json
   * {
   *   "success": true,
   *   "message": "Lấy thông tin learning item thành công",
   *   "data": {
   *     "learningItemId": 6667,
   *     "type": "HOMEWORK",
   *     "title": "Bài tập tuần 1",
   *     "description": "Hoàn thành bài thi được giao",
   *     "createdAt": "2026-07-18T08:00:00.000Z",
   *     "updatedAt": "2026-07-18T08:00:00.000Z",
   *     "studentLearningItem": null,
   *     "homeworkContents": [
   *       {
   *         "homeworkContentId": 91,
   *         "learningItemId": 6667,
   *         "type": "COMPETITION",
   *         "content": "Làm bài thi Toán",
   *         "dueDate": "2026-07-20T16:59:59.000Z",
   *         "allowLateSubmit": true,
   *         "competitionId": 15,
   *         "competition": {
   *           "competitionId": 15,
   *           "title": "Thi thử Toán",
   *           "startDate": "2026-07-15T00:00:00.000Z",
   *           "endDate": null,
   *           "durationMinutes": 60,
   *           "maxAttempts": 3,
   *           "allowViewScore": true
   *         },
   *         "homeworkSubmit": {
   *           "homeworkSubmitId": 45,
   *           "isDone": true,
   *           "submitAt": "2026-07-18T09:30:00.000Z",
   *           "competitionSubmitId": 120
   *         },
   *         "progress": {
   *           "isLearned": false,
   *           "isDone": true,
   *           "competitionSubmit": {
   *             "competitionSubmitId": 120,
   *             "attemptNumber": 2,
   *             "status": "SUBMITTED",
   *             "submittedAt": "2026-07-18T09:30:00.000Z",
   *             "totalPoints": 8,
   *             "maxPoints": 10
   *           },
   *           "attemptCount": 2,
   *           "maxAttempts": 3,
   *           "questionCount": 20,
   *           "dueDate": "2026-07-20T16:59:59.000Z",
   *           "deadline": "2026-07-20T16:59:59.000Z",
   *           "remainingTimeSeconds": 180000,
   *           "status": "REDO",
   *           "canAttempt": true
   *         }
   *       }
   *     ]
   *   }
   * }
   * ```
   * - `progress.competitionSubmit` có thể không xuất hiện khi học sinh chưa có lượt làm.
   *   API không trả `competitionSubmits[]` hoặc answer của các lượt cũ.
   * - Thông tin chi tiết learning item.
   * - Content tùy theo type (homework, document, youtube, video).
   * - Progress của student (isLearned, learnedAt). Với homework competition,
   *   `progress.competitionSubmit` chỉ là lượt làm gần nhất; API không trả mảng lịch sử lượt làm.
   * - Với HOMEWORK, `homeworkContents[].progress.status` được xác định theo thứ tự ưu tiên:
   *   1. `RESUME`: còn lượt thi `IN_PROGRESS` — luôn cho làm tiếp trước các rule deadline.
   *   2. `COMPLETED`: đã dùng hết `maxAttempts`.
   *   3. `OVERDUE`: đã qua `competition.endDate`, hoặc qua `dueDate` khi `allowLateSubmit = false`.
   *   4. Quá `dueDate`, còn trong `endDate` (hoặc competition không có `endDate`) và `allowLateSubmit = true`:
   *      - `LATE_SUBMIT`: chưa có bài nộp/lượt thi trước đó.
   *      - `LATE_REDO`: đã có bài nộp hoặc lượt thi trước đó, vẫn còn lượt làm.
   *   5. `NOT_STARTED`: chưa tới `competition.startDate`.
   *   6. `REDO`: còn hạn, đã có lượt nộp trước đó và vẫn còn lượt.
   *   7. `DO_NOW`: còn hạn, chưa có lượt nộp.
   * - `canAttempt` chỉ true cho `DO_NOW`, `RESUME`, `REDO`, `LATE_SUBMIT`, `LATE_REDO`
   *   và khi còn lượt. `endDate = null` nghĩa là không có hạn cuối của competition.
   */
  @Get(':id/student')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getStudentLearningItemById(
    @Param('id', ParseIntPipe) learningItemId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<StudentLearningItemResponseDto>> {
    return ExceptionHandler.execute(() => this.getStudentLearningItemByIdUseCase.execute(learningItemId, studentId))
  }

  /**
   * Stream video with Range Request support (for student)
   * GET /learning-items/:id/student/video/stream/:mediaId?token=xxx
   *
   * Rule:
   * - Learning item phải tồn tại.
   * - Learning item phải được gắn với ít nhất một lesson có visibility = PUBLISHED.
   * - Student phải có enrollment ACTIVE trong course của lesson public đó.
   * - Video thuộc learning item chỉ nằm trong lesson DRAFT hoặc PRIVATE sẽ không được stream.
   *
   * Hỗ trợ HTTP Range Requests để streaming video từng đoạn:
   * - Client gửi header "Range: bytes=0-1023" để request một phần của video
   * - Server trả về status 206 Partial Content với phần được request
   * - Cho phép video player load từng đoạn thay vì load toàn bộ video
   *
   * ⚠️ AUTHENTICATION VIA QUERY PARAMETER:
   * - HTML5 <video> element KHÔNG hỗ trợ custom headers (như Authorization)
   * - Token phải được gửi qua query parameter: ?token=xxx
   * - VideoStreamAuthGuard sẽ extract và validate token từ query param
   *
   * @param learningItemId - ID của learning item
   * @param mediaId - ID của media file (video)
   * @param studentId - ID của student (extracted from JWT token in query param)
   * @param req - Express Request để lấy Range header
   * @param res - Express Response để set headers cho streaming
   */
  @Get(':id/student/video/stream/:mediaId')
  @UseGuards(VideoStreamAuthGuard)
  async streamStudentVideo(
    @Param('id', ParseIntPipe) learningItemId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUser('studentId') studentId: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      // Parse Range header (e.g., "bytes=0-1023" or "bytes=1024-")
      const range = req.headers.range
      let rangeStart: number | undefined
      let rangeEnd: number | undefined

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        rangeStart = parts[0] ? parseInt(parts[0], 10) : undefined
        rangeEnd = parts[1] ? parseInt(parts[1], 10) : undefined
      }

      // Get video stream from use case
      const result = await this.streamStudentVideoUseCase.execute(
        learningItemId,
        mediaId,
        studentId,
        rangeStart,
        rangeEnd,
      )

      const { stream, totalSize, contentType, filename } = result

      // Calculate actual range
      const start = rangeStart ?? 0
      const end = rangeEnd ?? totalSize - 1
      const chunkSize = end - start + 1

      // Set appropriate headers for streaming
      if (range) {
        // Partial content response (206)
        res.status(HttpStatus.PARTIAL_CONTENT)
        res.set({
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        })
      } else {
        // Full content response (200)
        res.status(HttpStatus.OK)
        res.set({
          'Content-Length': totalSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        })
      }

      return new StreamableFile(stream)
    })
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getLearningItemById(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<LearningItemResponseDto>> {
    return ExceptionHandler.execute(() => this.getLearningItemByIdUseCase.execute(id))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createLearningItem(
    @Body() dto: CreateLearningItemDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<LearningItemResponseDto>> {
    return ExceptionHandler.execute(() => this.createLearningItemUseCase.execute(dto, adminId))
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateLearningItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLearningItemDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<LearningItemResponseDto>> {
    return ExceptionHandler.execute(() => this.updateLearningItemUseCase.execute(id, dto, adminId))
  }

  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.LEARNING_ITEM.DELETE)
  @HttpCode(HttpStatus.OK)
  async deleteLearningItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<null>> {
    return ExceptionHandler.execute(() => this.deleteLearningItemUseCase.execute(id, adminId))
  }
}
