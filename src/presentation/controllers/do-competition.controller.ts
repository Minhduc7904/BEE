// src/presentation/controllers/do-competition.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetCompetitionRemainingTimeUseCase,
    StartCompetitionAttemptUseCase,
    GetCompetitionExamUseCase,
    GetCompetitionAnswersUseCase,
    SubmitCompetitionAnswerUseCase,
    FinishCompetitionSubmitUseCase,
    GetStudentCompetitionHistoryUseCase,
    GetStudentCompetitionResultUseCase,
} from '../../application/use-cases/competition-submit'
import {
    SubmitCompetitionAnswerDto,
    UpdateCompetitionAnswerDto,
    CompetitionExamResponseDto,
    CompetitionAnswersResponseDto,
    StudentCompetitionHistoryQueryDto,
    StudentCompetitionHistoryListResponseDto,
    StudentCompetitionResultDto,
} from '../../application/dtos/competition-submit'

/**
 * Controller để xử lý việc làm bài thi (do competition)
 * Khác với CompetitionController (quản lý cuộc thi),
 * controller này xử lý việc học sinh làm bài thi
 */
@Injectable()
@Controller('do-competition')
export class DoCompetitionController {
    constructor(
        private readonly getCompetitionRemainingTimeUseCase: GetCompetitionRemainingTimeUseCase,
        private readonly startCompetitionAttemptUseCase: StartCompetitionAttemptUseCase,
        private readonly getCompetitionExamUseCase: GetCompetitionExamUseCase,
        private readonly getCompetitionAnswersUseCase: GetCompetitionAnswersUseCase,
        private readonly submitCompetitionAnswerUseCase: SubmitCompetitionAnswerUseCase,
        private readonly finishCompetitionSubmitUseCase: FinishCompetitionSubmitUseCase,
        private readonly getStudentCompetitionHistoryUseCase: GetStudentCompetitionHistoryUseCase,
        private readonly getStudentCompetitionResultUseCase: GetStudentCompetitionResultUseCase,
    ) { }

    /**
     * Start a new competition attempt
     * Bắt đầu một lần làm bài mới
     *
     * @route POST /do-competition/:competitionId/start
     * @param competitionId - Competition ID
     * @param studentId - Current student ID (auto-injected)
     * @returns Competition submit with status IN_PROGRESS
     *
     * Business Logic:
     * 1. Check if competition exists and is ongoing (within date range)
     * 2. Check if there's already an IN_PROGRESS attempt - if yes, return it
     * 3. Check maxAttempts limit (if set)
     * 4. Create new attempt with incremented attemptNumber
     *
     * @example
     * POST /do-competition/1/start
     * Response: {
     *   success: true,
     *   message: "Bắt đầu lần làm bài mới thành công",
     *   data: {
     *     competitionSubmitId: 1,
     *     competitionId: 1,
     *     studentId: 1,
     *     attemptNumber: 1,
     *     status: "IN_PROGRESS",
     *     startedAt: "2026-02-21T10:00:00Z"
     *   }
     * }
     */
    @Post(':competitionId/start')
    @RequirePermission()
    @HttpCode(HttpStatus.CREATED)
    async startAttempt(
        @Param('competitionId', ParseIntPipe) competitionId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() =>
            this.startCompetitionAttemptUseCase.execute(competitionId, studentId),
        )
    }

    /**
     * Get competition exam content
     * Lấy nội dung đề thi của cuộc thi (không hiển thị đáp án)
     *
     * @route GET /do-competition/:competitionId/exam
     * @param competitionId - Competition ID
     * @returns Exam with sections, questions, statements (without answers)
     *
     * Business Logic:
     * 1. Check if competition exists and has exam
     * 2. Check if competition allows viewing exam content (allowViewExamContent)
     * 3. Return exam with full structure but without answers
     *
     * Response Structure:
     * - Exam: title, description, grade, typeOfExam
     * - Sections: full information with order
     * - Questions: content, type, order (NO correctAnswer, NO solution)
     * - Statements: content, order (NO isCorrect)
     *
     * @example
     * GET /do-competition/1/exam
     * Response: {
     *   success: true,
     *   message: "Lấy đề thi thành công",
     *   data: {
     *     examId: 1,
     *     title: "Đề thi Toán học",
     *     sections: [
     *       {
     *         sectionId: 1,
     *         title: "Phần 1: Trắc nghiệm",
     *         order: 1,
     *         questions: [
     *           {
     *             questionId: 1,
     *             content: "Câu hỏi 1...",
     *             type: "SINGLE_CHOICE",
     *             order: 1,
     *             statements: [
     *               { statementId: 1, content: "Đáp án A", order: 1 },
     *               { statementId: 2, content: "Đáp án B", order: 2 }
     *             ]
     *           }
     *         ]
     *       }
     *     ]
     *   }
     * }
     */
    @Get(':competitionId/exam')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getCompetitionExam(
        @Param('competitionId', ParseIntPipe) competitionId: number,
    ): Promise<CompetitionExamResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getCompetitionExamUseCase.execute(competitionId),
        )
    }

    /**
     * Get current active attempt
     * Lấy lần làm bài hiện tại (đang IN_PROGRESS)
     *
     * @route GET /do-competition/:competitionId/current
     * @param competitionId - Competition ID
     * @param studentId - Current student ID (auto-injected)
     * @returns Current competition submit or null if no active attempt
     *
     * @example
     * GET /do-competition/1/current
     */
    @Get(':competitionId/current')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getCurrentAttempt(
        @Param('competitionId', ParseIntPipe) competitionId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        // TODO: Implement with use case
        // return ExceptionHandler.execute(() =>
        //     this.getCurrentAttemptUseCase.execute(competitionId, studentId),
        // )
        throw new Error('Not implemented yet')
    }

    /**
     * Get remaining time for current attempt
     * Tính thời gian còn lại để làm bài theo competition submit
     *
     * @route GET /do-competition/submit/:submitId/remaining-time
     * @param submitId - Competition submit ID
     * @returns Remaining time in seconds and formatted time
     *
     * @example
     * GET /do-competition/submit/1/remaining-time
     * Response: {
     *   success: true,
     *   data: {
     *     competitionSubmitId: 1,
     *     totalMinutes: 60,
     *     elapsedMinutes: 30,
     *     remainingMinutes: 30,
     *     isOverTime: false,
     *     formattedRemaining: "30:00",
     *     formattedElapsed: "30:00"
     *   }
     * }
     */
    @Get('submit/:submitId/remaining-time')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getRemainingTime(
        @Param('submitId', ParseIntPipe) submitId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() =>
            this.getCompetitionRemainingTimeUseCase.execute(submitId),
        )
    }

    /**
     * Submit an answer for a question
     * Nộp câu trả lời cho một câu hỏi
     *
     * @route POST /do-competition/submit/:submitId/answer
     * @param submitId - Competition submit ID
     * @param body - Answer data following SubmitCompetitionAnswerDto
     * @param studentId - Current student ID (auto-injected for verification)
     * @returns Created or updated competition answer
     *
     * @description
     * This endpoint allows students to submit answers during a competition attempt.
     * Depending on the question type:
     * - SHORT_ANSWER, ESSAY: Provide `answer` field with text
     * - SINGLE_CHOICE, MULTIPLE_CHOICE: Provide `selectedStatementIds` array
     * - TRUE_FALSE: Provide `trueFalseAnswers` array with { statementId, isTrue } objects
     * - Can optionally include `timeSpentSeconds` for analytics
     * 
     * If an answer already exists for this question in this attempt, it will be updated.
     * Otherwise, a new answer will be created.
     *
     * @example
     * POST /do-competition/submit/1/answer
     * Body (Text answer):
     * {
     *   "questionId": 5,
     *   "answer": "Paris là thủ đô của nước Pháp",
     *   "timeSpentSeconds": 45
     * }
     * 
     * Body (Multiple choice):
     * {
     *   "questionId": 6,
     *   "selectedStatementIds": [1, 3],
     *   "timeSpentSeconds": 30
     * }
     * 
     * Body (True/False):
     * {
     *   "questionId": 7,
     *   "trueFalseAnswers": [
     *     { "statementId": 1, "isTrue": true },
     *     { "statementId": 2, "isTrue": false },
     *     { "statementId": 3, "isTrue": true }
     *   ],
     *   "timeSpentSeconds": 25
     * }
     */
    @Post('submit/:submitId/answer/:answerId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async submitAnswer(
        @Param('submitId', ParseIntPipe) submitId: number,
        @Param('answerId', ParseIntPipe) answerId: number,
        @Body() body: SubmitCompetitionAnswerDto,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() =>
            this.submitCompetitionAnswerUseCase.execute(submitId, answerId, body, studentId),
        )
    }

    /**
     * Submit the entire competition (finish attempt)
     * Nộp bài thi (kết thúc lần làm bài)
     *
     * @route POST /do-competition/submit/:submitId/finish
     * @param submitId - Competition submit ID
     * @returns Submitted competition with graded results (if auto-grading enabled)
     *
     * @example
     * POST /do-competition/submit/1/finish
     * Response: {
     *   success: true,
     *   data: {
     *     competitionSubmitId: 1,
     *     status: "SUBMITTED",
     *     submittedAt: "2026-02-21T11:00:00Z",
     *     totalPoints: 85,
     *     maxPoints: 100,
     *     scorePercentage: 85.0
     *   }
     * }
     */
    @Post('submit/:submitId/finish')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async submitCompetition(
        @Param('submitId', ParseIntPipe) submitId: number,
        @CurrentUser('studentId') studentId: number,
        @Body() body?: { homeworkContentId?: number },
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() =>
            this.finishCompetitionSubmitUseCase.execute(submitId, studentId, body?.homeworkContentId),
        )
    }

    /**
     * Lấy lịch sử làm bài của học sinh theo competitionId (có phân trang)
     * Chỉ bao gồm các lần thi đã nộp bài (SUBMITTED / GRADED), không hiển thị IN_PROGRESS và ABANDONED.
     *
     * @route GET /do-competition/:competitionId/history
     *
     * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
     * @param competitionId  ID của cuộc thi
     * @query page           Trang hiện tại (mặc định 1)
     * @query limit          Kích thước trang, tối đa 100 (mặc định 10)
     * @query sortBy         Trường sắp xếp (mặc định submittedAt)
     * @query sortOrder      Chiều sắp xếp: asc | desc (mặc định desc)
     *
     * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
     * @returns StudentCompetitionHistoryListResponseDto
     *   data.history[]     - danh sách lần thi (attemptNumber, status, điểm, thời gian)
     *   data.pagination    - { total, page, limit, totalPages }
     */
    @Get(':competitionId/history')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getAttemptHistory(
        @Param('competitionId', ParseIntPipe) competitionId: number,
        @CurrentUser('studentId') studentId: number,
        @Query() query: StudentCompetitionHistoryQueryDto,
    ): Promise<StudentCompetitionHistoryListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getStudentCompetitionHistoryUseCase.execute(competitionId, studentId, query),
        )
    }

    /**
     * Get specific attempt details
     * Xem chi tiết một lần làm bài cụ thể
     *
     * @route GET /do-competition/submit/:submitId
     * @param submitId - Competition submit ID
     * @returns Competition submit with all answers
     *
     * @example
     * GET /do-competition/submit/1
     */
    @Get('submit/:submitId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getAttemptDetail(
        @Param('submitId', ParseIntPipe) submitId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        // TODO: Implement with use case
        // return ExceptionHandler.execute(() =>
        //     this.getAttemptDetailUseCase.execute(submitId, studentId),
        // )
        throw new Error('Not implemented yet')
    }

    /**
     * Get answers for current attempt
     * Lấy danh sách câu trả lời của lần làm bài hiện tại
     *
     * @route GET /do-competition/submit/:submitId/answers
     * @param submitId - Competition submit ID
     * @returns List of competition answers
     *
     * @example
     * GET /do-competition/submit/1/answers
     */
    @Get('submit/:submitId/answers')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getAnswers(
        @Param('submitId', ParseIntPipe) submitId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<CompetitionAnswersResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getCompetitionAnswersUseCase.execute(submitId, studentId),
        )
    }

    /**
     * Update an answer (before submitting competition)
     * Cập nhật câu trả lời (trước khi nộp bài)
     *
     * @route PUT /do-competition/answer/:answerId
     * @param answerId - Competition answer ID
     * @param body - Updated answer data following UpdateCompetitionAnswerDto
     * @param studentId - Current student ID (auto-injected for verification)
     * @returns Updated competition answer
     *
     * @description
     * This endpoint allows students to modify their answers before submitting the competition.
     * All fields in the DTO are optional - only provide fields you want to update.
     * 
     * Business Rules:
     * - Can only update answers for competitions with status IN_PROGRESS
     * - Must be the owner of the competition submit
     * - Cannot update after competition is submitted
     *
     * @example
     * PUT /do-competition/answer/123
     * Body (Update text answer):
     * {
     *   "answer": "Paris là thủ đô của nước Pháp (đã cập nhật)",
     *   "timeSpentSeconds": 60
     * }
     * 
     * Body (Update selected options):
     * {
     *   "selectedStatementIds": [2, 4, 5]
     * }
     * 
     * Body (Update true/false answers):
     * {
     *   "trueFalseAnswers": [
     *     { "statementId": 1, "isTrue": false },
     *     { "statementId": 2, "isTrue": true }
     *   ]
     * }
     */
    @Put('answer/:answerId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async updateAnswer(
        @Param('answerId', ParseIntPipe) answerId: number,
        @Body() body: UpdateCompetitionAnswerDto,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        // TODO: Implement with use case
        // return ExceptionHandler.execute(() =>
        //     this.updateAnswerUseCase.execute(answerId, body, studentId),
        // )
        throw new Error('Not implemented yet')
    }

    /**
     * Get competition leaderboard
     * Xem bảng xếp hạng cuộc thi
     *
     * @route GET /do-competition/:competitionId/leaderboard
     * @param competitionId - Competition ID
     * @param limit - Number of top entries to return (default: 10)
     * @returns Top competition submits ordered by score
     *
     * @example
     * GET /do-competition/1/leaderboard?limit=20
     */
    @Get(':competitionId/leaderboard')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getLeaderboard(
        @Param('competitionId', ParseIntPipe) competitionId: number,
        @Query('limit', ParseIntPipe) limit: number = 10,
    ): Promise<BaseResponseDto<any[]>> {
        // TODO: Implement with use case
        // return ExceptionHandler.execute(() =>
        //     this.getLeaderboardUseCase.execute(competitionId, limit),
        // )
        throw new Error('Not implemented yet')
    }

    /**
     * Abandon current attempt
     * Từ bỏ lần làm bài hiện tại
     *
     * @route POST /do-competition/submit/:submitId/abandon
     * @param submitId - Competition submit ID
     * @returns Updated competition submit with ABANDONED status
     *
     * @example
     * POST /do-competition/submit/1/abandon
     */
    @Post('submit/:submitId/abandon')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async abandonAttempt(
        @Param('submitId', ParseIntPipe) submitId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<any>> {
        // TODO: Implement with use case
        // return ExceptionHandler.execute(() =>
        //     this.abandonAttemptUseCase.execute(submitId, studentId),
        // )
        throw new Error('Not implemented yet')
    }

    /**
     * Lấy kết quả bài nộp theo 3 rule của cuộc thi
     *
     * @route GET /do-competition/submit/:submitId/result
     * @param submitId - ID bài nộp (CompetitionSubmit.competitionSubmitId)
     * @param studentId - ID học sinh hiện tại (auto-inject)
     *
     * @returns StudentCompetitionResultDto
     *
     * Rules áp dụng từ cấu hình competition:
     *   Rule 1 – allowViewScore  : trả totalPoints, maxPoints, scorePercentage;
     *                               nếu kết hợp với Rule 2 thì thêm điểm/isCorrect từng câu.
     *   Rule 2 – showResultDetail: trả nội dung câu hỏi, statements, câu trả lời đã chọn.
     *   Rule 3 – allowViewAnswer : trả thêm correctAnswer, solution của từng câu,
     *                               isCorrect của từng statement.
     *
     * @example
     * GET /do-competition/submit/42/result
     */
    @Get('submit/:submitId/result')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentCompetitionResult(
        @Param('submitId', ParseIntPipe) submitId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentCompetitionResultDto>> {
        return ExceptionHandler.execute(() =>
            this.getStudentCompetitionResultUseCase.execute(submitId, studentId),
        )
    }
}
