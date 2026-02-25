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
    CreateCompetitionDto,
    UpdateCompetitionDto,
    CompetitionListQueryDto,
    StudentOwnRankingResponseDto,
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
    GetCompetitionRankingUseCase,
} from '../../application/use-cases/competition'
import { Visibility } from 'src/shared/enums'
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
        private readonly getCompetitionRankingUseCase: GetCompetitionRankingUseCase,
    ) { }

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
     * Get student's own competition ranking
     *
     * @route GET /competitions/:id/student/ranking
     * @param id - Competition ID
     * @param studentId - Current student ID (auto-injected)
     * @returns All student's attempts with their ranks and highest achievement
     *
     * @example
     * GET /competitions/123/student/ranking
     *
     * @description
     * This endpoint returns all attempts made by the current student for this competition:
     * - Each attempt shows its rank compared to all other students
     * - Includes highest score achieved and best rank
     * - Only counts GRADED submissions for ranking
     * - Only works if competition.allowLeaderboard is true
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
