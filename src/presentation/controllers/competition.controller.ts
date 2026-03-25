// src/presentation/controllers/competition.controller.ts
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
} from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import {
    CompetitionResponseDto,
    CompetitionListResponseDto,
    PublicStudentCompetitionListResponseDto,
    PublicStudentCompetitionDetailApiResponseDto,
    PublicStudentCompetitionExamResponseDto,
    CreateCompetitionDto,
    UpdateCompetitionDto,
    CompetitionListQueryDto,
    CompetitionRankingQueryDto,
    CompetitionRankingResponseDto,
    StudentOwnRankingResponseDto,
    CompetitionQuestionStatsDto,
    CompetitionQuestionStatsResponseDto,
} from '../../application/dtos/competition'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllCompetitionsUseCase,
    GetCompetitionByIdUseCase,
    CreateCompetitionUseCase,
    UpdateCompetitionUseCase,
    DeleteCompetitionUseCase,
    SearchCompetitionsUseCase,
    GetPublicStudentCompetitionsUseCase,
    GetPublicStudentCompetitionDetailUseCase,
    GetPublicStudentCompetitionExamUseCase,
    GetPublicStudentCompetitionHistoryUseCase,
    GetCompetitionRankingUseCase,
    GetCompetitionLeaderboardUseCase,
    GetCompetitionQuestionStatsUseCase,
} from '../../application/use-cases/competition'
import { Visibility } from 'src/shared/enums'
import { StudentCompetitionHistoryQueryDto } from '../../application/dtos/competition-submit/student-competition-history-query.dto'
import { StudentCompetitionHistoryListResponseDto } from '../../application/dtos/competition-submit/student-competition-history.dto'
@Injectable()
@Controller('competitions')
export class CompetitionController {
    constructor(
        private readonly getAllCompetitionsUseCase: GetAllCompetitionsUseCase,
        private readonly getCompetitionByIdUseCase: GetCompetitionByIdUseCase,
        private readonly createCompetitionUseCase: CreateCompetitionUseCase,
        private readonly updateCompetitionUseCase: UpdateCompetitionUseCase,
        private readonly deleteCompetitionUseCase: DeleteCompetitionUseCase,
        private readonly searchCompetitionsUseCase: SearchCompetitionsUseCase,
        private readonly getPublicStudentCompetitionsUseCase: GetPublicStudentCompetitionsUseCase,
        private readonly getPublicStudentCompetitionDetailUseCase: GetPublicStudentCompetitionDetailUseCase,
        private readonly getPublicStudentCompetitionExamUseCase: GetPublicStudentCompetitionExamUseCase,
        private readonly getPublicStudentCompetitionHistoryUseCase: GetPublicStudentCompetitionHistoryUseCase,
        private readonly getCompetitionRankingUseCase: GetCompetitionRankingUseCase,
        private readonly getCompetitionLeaderboardUseCase: GetCompetitionLeaderboardUseCase,
        private readonly getCompetitionQuestionStatsUseCase: GetCompetitionQuestionStatsUseCase,
    ) { }

    /**
     * Get public competitions for the current student.
     *
     * @route GET /competitions/public/student
    * @param query - Query parameters (page, limit, examId, grade, search, publicStatus)
     * @param studentId - Current student ID (auto-injected)
     * @returns Paginated public competitions with student-attempt state and availability.
     *
     * Response item fields:
     * - competitionId, title, subtitle, examId
     * - exam: { examId, title, grade, visibility }
     * - startDate, endDate, durationMinutes
     * - timelineStatus: ONGOING | UPCOMING | ENDED
     * - attemptStatus: ATTEMPTED | NOT_ATTEMPTED
     * - canAttempt: boolean
     * - attemptedCount, maxAttempts
     *
     * @example
     * GET /competitions/public/student?publicStatus=ONGOING
    * GET /competitions/public/student?grade=10
     * GET /competitions/public/student?publicStatus=ENDED
     * GET /competitions/public/student?publicStatus=UPCOMING
     * GET /competitions/public/student?publicStatus=ATTEMPTED
     */
    @Get('public/student')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPublicStudentCompetitions(
        @Query() query: CompetitionListQueryDto,
        @CurrentUser('studentId') studentId?: number,
    ): Promise<PublicStudentCompetitionListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getPublicStudentCompetitionsUseCase.execute(query, studentId),
        )
    }

    /**
     * Get public competition detail for current student.
     *
     * @route GET /competitions/public/student/:id
     * @param id - Competition ID
     * @param studentId - Current student ID (auto-injected)
     * @returns PublicStudentCompetitionDetailApiResponseDto
     *
     * Response shape:
     * - success: boolean
     * - message: string
     * - data:
     *   - competitionId: number
     *   - title: string
     *   - subtitle?: string | null
     *   - examId?: number | null
     *   - exam?: {
     *       examId: number,
     *       title: string,
     *       grade?: number,
     *       visibility: string
     *     } | null
     *   - startDate?: Date | null
     *   - endDate?: Date | null
     *   - durationMinutes?: number | null
     *   - maxAttempts?: number | null
     *   - attemptedCount: number
     *   - attemptStatus: ATTEMPTED | NOT_ATTEMPTED
     *   - timelineStatus: ONGOING | UPCOMING | ENDED
     *   - canAttempt: boolean
     *   - showResultDetail: boolean
     *   - allowLeaderboard: boolean
     *   - allowViewScore: boolean
     *   - allowViewAnswer: boolean
     *   - allowViewSolutionYoutubeUrl: boolean
     *   - allowViewExamContent: boolean
     *
     * Timeline masking rule for view/result flags:
     * - If endDate is null OR endDate >= now, all flags below are forced to false:
     *   showResultDetail, allowLeaderboard, allowViewScore,
     *   allowViewAnswer, allowViewSolutionYoutubeUrl, allowViewExamContent.
     * - Only when endDate < now, these flags reflect real competition settings.
     *
     * @example
     * GET /competitions/public/student/123
     */
    @Get('public/student/:id')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPublicStudentCompetitionDetail(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('studentId') studentId?: number,
    ): Promise<PublicStudentCompetitionDetailApiResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getPublicStudentCompetitionDetailUseCase.execute(id, studentId),
        )
    }

    /**
     * Get public exam content by competition for current student.
     *
     * @route GET /competitions/:id/student/exam
     * @param id - Competition ID
        * @returns PublicStudentCompetitionExamResponseDto
        *
        * Response shape:
        * - success: boolean
        * - message: string
        * - data:
        *   - examId: number
        *   - title: string
        *   - description?: string | null
        *   - processedDescription?: string | null
        *   - grade?: number
        *   - subject?: {
        *       subjectId?: number | null,
        *       name?: string | null
        *     }
        *   - createdBy: number
        *   - typeOfExam?: TypeOfExam | null
        *   - sections: Array<{
        *       sectionId: number,
        *       title: string,
        *       description?: string | null,
        *       processedDescription?: string | null,
        *       order: number
        *     }>
        *   - questions: Array<{
        *       questionId: number,
        *       sectionId?: number | null,
        *       order?: number | null,
        *       type: QuestionType,
        *       content: string,
        *       processedContent?: string,
        *       difficulty?: Difficulty | null,
        *       pointsOrigin?: number | null,
        *       statements: Array<{
        *         statementId: number,
        *         content: string,
        *         processedContent?: string,
        *         order?: number | null
        *       }>
        *     }>
        *
        * Access rules:
        * - Competition must exist and be PUBLISHED.
        * - Competition must allow allowViewExamContent = true.
        * - If one of the rules fails, endpoint returns NotFound/Forbidden.
        *
        * Media processing:
        * - description/content/statement content are processed to include presigned URLs
        *   (same pattern as question content processing use-cases).
        *
        * @example
        * GET /competitions/123/student/exam
     */
    @Get(':id/student/exam')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPublicStudentCompetitionExam(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<PublicStudentCompetitionExamResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getPublicStudentCompetitionExamUseCase.execute(id),
        )
    }

    /**
     * Get current student's attempt history for a public competition.
     *
     * @route GET /competitions/:id/student/history
     * @param id - Competition ID
     * @param query - Pagination query (page, limit, sortBy, sortOrder)
     * @param studentId - Current student ID (auto-injected)
        * @returns StudentCompetitionHistoryListResponseDto
        *
        * Response shape:
        * - success: boolean
        * - message: string
        * - data:
        *   - history: Array<{
        *       competitionSubmitId: number,
        *       attemptNumber: number,
        *       status: IN_PROGRESS | SUBMITTED | GRADED | ABANDONED,
        *       startedAt?: Date,
        *       submittedAt?: Date,
        *       timeSpentSeconds?: number,
        *       timeSpentDisplay?: string,
        *       totalPoints?: number,
        *       maxPoints?: number,
        *       scorePercentage?: number,
        *       isGraded: boolean,
        *       hasScore: boolean,
        *       createdAt: Date,
        *       updatedAt: Date
        *     }>
        *   - pagination: {
        *       total: number,
        *       page: number,
        *       limit: number,
        *       totalPages: number
        *     }
     *
     * Access rules:
     * - Competition must exist and be PUBLISHED.
     * - Competition must allow allowViewScore = true.
     *
     * @example
     * GET /competitions/123/student/history?page=1&limit=10
     */
    @Get(':id/student/history')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPublicStudentCompetitionHistory(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: StudentCompetitionHistoryQueryDto,
        @CurrentUser('studentId') studentId: number,
    ): Promise<StudentCompetitionHistoryListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getPublicStudentCompetitionHistoryUseCase.execute(id, studentId, query),
        )
    }

    /**
     * Get my competitions (created by current user)
     *
     * @route GET /competitions/my-competitions
     * @param query - Query parameters (page, limit, examId, visibility, etc.)
     * @param adminId - Current admin ID (auto-injected)
     * @returns Paginated list of competitions created by current user
     *
     * @example
     * GET /competitions/my-competitions?page=1&limit=10&visibility=PUBLISHED
     */
    @Get('my-competitions')
    @RequirePermission(PERMISSION_CODES.COMPETITION.GET_MY_COMPETITIONS)
    @HttpCode(HttpStatus.OK)
    async getMyCompetitions(
        @Query() query: CompetitionListQueryDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<CompetitionListResponseDto> {
        // Automatically filter by current user's adminId
        query.createdBy = adminId
        return ExceptionHandler.execute(() => this.getAllCompetitionsUseCase.execute(query))
    }

    /**
     * Search competitions
     *
     * @route GET /competitions/search
     * @param query - Query parameters (search, page, limit, visibility, etc.)
     * @returns Paginated list of competitions matching search criteria
     *
     * @example
     * GET /competitions/search?search=olimpiad&page=1&limit=10
     */
    @Get('search')
    @RequirePermission(PERMISSION_CODES.COMPETITION.SEARCH)
    @HttpCode(HttpStatus.OK)
    async searchCompetitions(
        @Query() query: CompetitionListQueryDto,
        @CurrentUser() user?: any,
    ): Promise<CompetitionListResponseDto> {
        // All permission logic is handled in the UseCase
        const context = {
            user: {
                adminId: user?.adminId,
                studentId: user?.studentId,
                permissions: user?.permissions ?? [],
            },
        }

        return ExceptionHandler.execute(() =>
            this.searchCompetitionsUseCase.execute(query, context),
        )
    }


    /**
     * Get all competitions with filters
     *
     * @route GET /competitions
     * @param query - Query parameters (page, limit, examId, visibility, etc.)
     * @returns Paginated list of competitions
     *
     * @example
     * GET /competitions?page=1&limit=10&examId=5&visibility=PUBLISHED
     */
    @Get()
    @RequirePermission(PERMISSION_CODES.COMPETITION.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllCompetitions(@Query() query: CompetitionListQueryDto): Promise<CompetitionListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllCompetitionsUseCase.execute(query))
    }

    /**
     * Get the current student's ranking summary for a competition.
     *
     * @route GET /competitions/:id/student/ranking
     * @param id - Competition ID
     * @param studentId - Current student ID (auto-injected)
     * @returns StudentOwnRankingResponseDto with attempts and best achievement.
     *
     * Response shape:
     * - success: boolean
     * - message: string
     * - data:
     *   - competitionId: number
     *   - competitionTitle: string
     *   - totalAttempts: number
     *   - highestScore: number
     *   - highestRank?: number
     *   - attempts: Array<{
     *       rank: number,                  // rank = 0 if the attempt is not graded yet
     *       competitionSubmitId: number,
     *       totalPoints: number,
     *       maxPoints?: number,
     *       percentageScore?: number,
     *       attemptNumber: number,
     *       submittedAt?: Date,
     *       timeSpentSeconds?: number,
     *       status: string
     *     }>
     *
     * Behavior notes:
     * - Ranking is computed only for GRADED attempts.
     * - Tie-break order: higher score, then lower timeSpentSeconds, then earlier submittedAt.
     * - Endpoint is available only when competition.allowLeaderboard = true.
     * - If the student has no attempts, attempts will be an empty array.
     *
     * @example
     * GET /competitions/123/student/ranking
     */
    @Get(':id/student/ranking')
    @RequirePermission() // Public endpoint for students
    @HttpCode(HttpStatus.OK)
    async getCompetitionRanking(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<StudentOwnRankingResponseDto> {
        return ExceptionHandler.execute(() => this.getCompetitionRankingUseCase.execute(id, studentId))
    }

    /**
     * Get competition leaderboard across all students.
     *
     * @route GET /competitions/:id/ranking
     * @param id - Competition ID
     * @param query - Pagination query (page, limit)
        * @returns CompetitionRankingResponseDto
        *
        * Response shape:
        * - success: boolean
        * - message: string
        * - data:
        *   - competitionId: number
        *   - competitionTitle: string
        *   - currentUserRank?: number | null   // rank riêng của user hiện tại (không nằm trong rankings)
        *   - currentUserRanking?: {            // chi tiết entry của user hiện tại
        *       rank: number,
        *       competitionSubmitId: number,
        *       student: {
        *         studentId: number,
        *         userId: number,
        *         firstName: string,
        *         lastName: string,
        *         fullName: string,
        *         grade?: number,
        *         school?: string,
        *         avatarUrl?: string
        *       },
        *       totalPoints: number,
        *       maxPoints?: number,
        *       percentageScore?: number,
        *       attemptNumber: number,
        *       submittedAt?: Date,
        *       timeSpentSeconds?: number
        *     } | null
        *   - rankings: Array<{
        *       rank: number,
        *       competitionSubmitId: number,
        *       student: {
        *         studentId: number,
        *         userId: number,
        *         firstName: string,
        *         lastName: string,
        *         fullName: string,
        *         grade?: number,
        *         school?: string
        *       },
        *       totalPoints: number,
        *       maxPoints?: number,
        *       percentageScore?: number,
        *       attemptNumber: number,
        *       submittedAt?: Date,
        *       timeSpentSeconds?: number
        *     }>
        *   - pagination: {
        *       total: number,
        *       page: number,
        *       limit: number,
        *       totalPages: number
        *     }
     *
     * Rules:
     * - Only GRADED attempts are considered.
     * - Each student contributes only one row (their best attempt).
     * - Best attempt is chosen by: highest score, then lower timeSpentSeconds, then earlier startedAt.
     * - Attempt startedAt must be inside competition time window.
        * - Ranking output is sorted by best score, then lower time, then earlier startedAt.
        *
        * @example
        * GET /competitions/123/ranking?page=1&limit=20
     */
    @Get(':id/ranking')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getCompetitionLeaderboard(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: CompetitionRankingQueryDto,
        @CurrentUser('studentId') studentId?: number,
    ): Promise<CompetitionRankingResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getCompetitionLeaderboardUseCase.execute(
                id,
                query.page ?? 1,
                query.limit ?? 10,
                studentId,
            ),
        )
    }

    /**
     * [Admin] Thống kê đúng/sai theo từng câu hỏi của cuộc thi.
     *
     * @route GET /competitions/:id/question-stats
     * @param id - Competition ID
     * @returns Danh sách câu hỏi kèm số lần đúng / sai+bỏ trống
     *
     * @example
     * GET /competitions/123/question-stats
     *
     * @description
     * Chỉ tính trên các bài nộp có status = GRADED.
     * - correctCount  = số bài GRADED có isCorrect = true cho câu đó.
     * - wrongCount    = totalGradedSubmissions - correctCount
     *   (bao gồm cả trả lời sai lẫn bỏ trống).
     * - correctRate / wrongRate tính theo % làm tròn.
     */
    @Get(':id/question-stats')
    @RequirePermission(PERMISSION_CODES.COMPETITION.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getCompetitionQuestionStats(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<CompetitionQuestionStatsDto>> {
        return ExceptionHandler.execute(() => this.getCompetitionQuestionStatsUseCase.execute(id))
    }

    /**
     * Get competition by ID
     *
     * @route GET /competitions/:id
     * @param id - Competition ID
     * @returns Competition details with exam and creator info
     *
     * @example
     * GET /competitions/123
     */
    @Get(':id')
    @RequirePermission(PERMISSION_CODES.COMPETITION.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getCompetitionById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<CompetitionResponseDto>> {
        return ExceptionHandler.execute(() => this.getCompetitionByIdUseCase.execute(id))
    }

    /**
     * Create new competition
     *
     * @route POST /competitions
     * @param dto - Competition data
     * @param adminId - Current admin ID
     * @returns Created competition
     *
     * @example
     * POST /competitions
     * Body: {
     *   "title": "Cuộc thi Toán học Olympiad 2024",
     *   "subtitle": "Dành cho học sinh lớp 10-12",
     *   "examId": 5,
     *   "startDate": "2024-06-01T00:00:00Z",
     *   "endDate": "2024-06-30T23:59:59Z",
     *   "visibility": "DRAFT",
     *   "durationMinutes": 90,
     *   "maxAttempts": 3
     * }
     */
    @Post()
    @RequirePermission(PERMISSION_CODES.COMPETITION.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createCompetition(
        @Body() dto: CreateCompetitionDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<CompetitionResponseDto>> {
        return ExceptionHandler.execute(() => this.createCompetitionUseCase.execute(dto, adminId))
    }

    /**
     * Update competition
     *
     * @route PUT /competitions/:id
     * @param id - Competition ID
     * @param dto - Updated competition data
     * @param adminId - Current admin ID
     * @returns Updated competition
     *
     * @example
     * PUT /competitions/123
     * Body: {
     *   "title": "Cuộc thi Toán học Olympiad 2024 - Vòng chung kết",
     *   "visibility": "PUBLISHED"
     * }
     */
    @Put(':id')
    @RequirePermission(PERMISSION_CODES.COMPETITION.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateCompetition(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCompetitionDto,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<CompetitionResponseDto>> {
        return ExceptionHandler.execute(() => this.updateCompetitionUseCase.execute(id, dto, adminId))
    }

    /**
     * Delete competition
     *
     * @route DELETE /competitions/:id
     * @param id - Competition ID
     * @param adminId - Current admin ID
     * @returns Success message
     *
     * @example
     * DELETE /competitions/123
     */
    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.COMPETITION.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteCompetition(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId?: number,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() => this.deleteCompetitionUseCase.execute(id, adminId))
    }
}
