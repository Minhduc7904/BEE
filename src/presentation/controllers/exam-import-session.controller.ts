// src/presentation/controllers/exam-import-session.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ExamImportSessionListQueryDto,
  ExamImportSessionListResponseDto,
  ExamImportSessionResponseDto,
  UpdateExamImportSessionRawContentDto,
} from '../../application/dtos/exam-import-session'
import {
  GetAllExamImportSessionsUseCase,
  CreateExamImportSessionUseCase,
  GetExamImportSessionByIdUseCase,
  GetExamImportSessionRawContentUseCase,
  UpdateExamImportSessionRawContentUseCase,
  SplitExamFromSessionUseCase,
  SplitExamFromRawContentUseCase,
  ClassifyQuestionChaptersUseCase,
  MigrateTempToFinalExamUseCase,
  ManualSplitQuestionsUseCase,
} from '../../application/use-cases/exam-import-session'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CurrentUser } from '../../shared/decorators'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { MediaRawContentResponseDto } from '../../application/dtos/media/media-raw-content-response.dto'
import { DefaultValuePipe, ParseIntPipe } from '@nestjs/common'
import {
  SplitExamFromRawContentDto,
  SplitExamResponseDto,
  ManualSplitQuestionsDto,
  ManualSplitQuestionsResponseDto,
} from '../../application/dtos/exam-import-session'
import { ClassifyQuestionChaptersResponseDto } from '../../application/use-cases/exam-import-session/classify-question-chapters.use-case'
@Controller('exam-import-sessions')
export class ExamImportSessionController {
  constructor(
    private readonly getAllExamImportSessionsUseCase: GetAllExamImportSessionsUseCase,
    private readonly splitExamFromSessionUseCase: SplitExamFromSessionUseCase,
    private readonly splitExamFromRawContentUseCase: SplitExamFromRawContentUseCase,
    private readonly getExamImportSessionRawContentUseCase: GetExamImportSessionRawContentUseCase,
    private readonly updateExamImportSessionRawContentUseCase: UpdateExamImportSessionRawContentUseCase,
    private readonly createExamImportSessionUseCase: CreateExamImportSessionUseCase,
    private readonly getExamImportSessionByIdUseCase: GetExamImportSessionByIdUseCase,
    private readonly classifyQuestionChaptersUseCase: ClassifyQuestionChaptersUseCase,
    private readonly migrateTempToFinalExamUseCase: MigrateTempToFinalExamUseCase,
    private readonly manualSplitQuestionsUseCase: ManualSplitQuestionsUseCase,
  ) { }

  @Get()
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAllSessions(
    @Query() query: ExamImportSessionListQueryDto,
  ): Promise<ExamImportSessionListResponseDto> {
    return ExceptionHandler.execute(() => this.getAllExamImportSessionsUseCase.execute(query))
  }

  @Post()
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createExamImportSessionUseCase.execute(adminId),
    )
  }

  @Get(':sessionId')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSessionById(
    @Param('sessionId') sessionId: number,
  ): Promise<BaseResponseDto<ExamImportSessionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getExamImportSessionByIdUseCase.execute(sessionId),
    )
  }

  /**
   * Get raw content with presigned URLs for exam import session
   * Can only view raw content of sessions created by self
   */
  @Get(':sessionId/raw-content/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getSessionRawContent(
    @Param('sessionId') sessionId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getExamImportSessionRawContentUseCase.execute(sessionId, adminId, expirySeconds),
    )
  }

  /**
   * Update raw content for exam import session
   * Can only update sessions created by self
   * Automatically cleans up unused media
   */
  @Put(':sessionId/raw-content/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async updateSessionRawContent(
    @Param('sessionId') sessionId: number,
    @Body() dto: UpdateExamImportSessionRawContentDto,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<{ rawContent: string; deletedMediaCount: number }>> {
    return ExceptionHandler.execute(() =>
      this.updateExamImportSessionRawContentUseCase.execute(sessionId, user.adminId, dto.rawContent, user.userId),
    )
  }

  /**
  * Tách câu hỏi từ rawContent của session
  * Lấy rawContent từ database và sử dụng AI để tách câu hỏi
  * Chỉ người tạo session mới được sử dụng
  */
  @Post(':sessionId/split-questions/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async splitExamFromSession(
    @Param('sessionId') sessionId: number,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<SplitExamResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.splitExamFromSessionUseCase.execute(sessionId, user.adminId, user.userId),
    )
  }

  /**
   * Tách câu hỏi từ rawContent do người dùng truyền vào
   * Lưu kết quả vào session hiện tại (không tạo session mới)
   * Chỉ người tạo session mới được sử dụng
   */
  @Post(':sessionId/split-question/raw-content')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async splitExamFromRawContent(
    @Param('sessionId') sessionId: number,
    @Body() dto: SplitExamFromRawContentDto,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<SplitExamResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.splitExamFromRawContentUseCase.execute(sessionId, dto.rawContent, user.adminId, user.userId),
    )
  }

  /**
   * Phân loại chapters cho các câu hỏi của session
   * Sử dụng AI để phân loại và lưu kết quả vào TempQuestionChapter
   * Chỉ người tạo session mới được sử dụng
   */
  @Post(':sessionId/classify-chapters/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async classifyQuestionChapters(
    @Param('sessionId') sessionId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ClassifyQuestionChaptersResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.classifyQuestionChaptersUseCase.execute(sessionId, adminId),
    )
  }

  /**
   * Tách câu hỏi thủ công từ nội dung thô (rawContent) theo loại câu hỏi chỉ định.
   * Chỉ người tạo session mới được sử dụng.
   *
   * ─── ĐẦU VÀO ────────────────────────────────────────────────────────────────
   * @param sessionId   ID của ExamImportSession (path param)
   * @body rawContent   Chuỗi văn bản thô chứa danh sách câu hỏi cần tách.
   *                    Định dạng mỗi câu: "Câu 1." / "câu 1:" / "Cau 1)" ...
   *                    - SINGLE_CHOICE  : mỗi câu có các đáp án A. B. C. D. (hỗ trợ tới F),
   *                                       theo sau là "Lời giải" (tuỳ chọn).
   *                    - TRUE_FALSE     : mỗi câu có các mệnh đề a. b. c. d. (hỗ trợ tới f),
   *                                       theo sau là "Lời giải" (tuỳ chọn).
   *                    - SHORT_ANSWER   : mỗi câu là đoạn văn, theo sau là "Lời giải" (tuỳ chọn).
   *
   * @body questionType Loại câu hỏi: SINGLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ...
   *
   * @body answers      (tuỳ chọn) Chuỗi đáp án cách nhau bởi dấu cách, theo thứ tự câu.
   *                    - SINGLE_CHOICE / MULTIPLE_CHOICE : chữ cái hoặc tổ hợp chữ cái
   *                      biểu thị đáp án đúng. Ví dụ: "A B AB D" (câu 3 có 2 đáp án đúng A,B).
   *                    - TRUE_FALSE : chuỗi Đ/đ/D/d (=Đúng) và S/s (=Sai) theo thứ tự mệnh đề.
   *                      Ví dụ: "ĐSĐs ĐSss" → câu 1: a=Đ b=S c=Đ d=S; câu 2: a=Đ b=S c=S d=S.
   *                    - SHORT_ANSWER   : mỗi token là giá trị đáp án của câu tương ứng.
   *                      Ví dụ: "2 20 3.14"
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────────
   * @returns ManualSplitQuestionsResponseDto
   *   - questionType        : loại câu hỏi đã tách
   *   - tempSectionId/Title/Order : thông tin TempSection được tìm hoặc tạo mới
   *   - questions[]         : danh sách câu hỏi đã tách (order, content, type,
   *                           statements[], correctAnswer, solution, rawText)
   *   - totalQuestions      : tổng số câu tách được
   *   - savedQuestions      : số câu đã lưu DB (chỉ có khi không có lỗi)
   *   - savedStatements     : số đáp án đã lưu DB (chỉ có khi không có lỗi)
   *   - hasParseErrors      : có dòng lỗi hay không
   *   - parseErrors[]       : danh sách lỗi theo dòng { lineIndex, line, message }
   *                           (nếu có lỗi thì KHÔNG lưu DB, trả về để người dùng sửa)
   *   - processingTimeMs    : thời gian xử lý (ms)
   */
  @Post(':sessionId/manual-split/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async manualSplitQuestions(
    @Param('sessionId') sessionId: number,
    @Body() dto: ManualSplitQuestionsDto,
    @CurrentUser() user: { adminId: number; userId: number },
  ): Promise<BaseResponseDto<ManualSplitQuestionsResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.manualSplitQuestionsUseCase.execute(sessionId, user.adminId, user.userId, dto),
    )
  }

  /**
   * Migrate temp exam data to final exam tables
   * Tạo Exam, Sections, Questions, Statements từ temp tables
   * Chỉ người tạo session mới được sử dụng
   */
  @Post(':sessionId/migrate/my')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async migrateTempToFinalExam(
    @Param('sessionId') sessionId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{
    examId: number
    totalSections: number
    totalQuestions: number
    totalStatements: number
    totalChapters: number
  }>> {
    return ExceptionHandler.execute(() =>
      this.migrateTempToFinalExamUseCase.execute({ sessionId, adminId }),
    )
  }
}
