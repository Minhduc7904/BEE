// src/presentation/controllers/competition-submit.controller.ts
import {
    Controller,
    Get,
    Delete,
    Query,
    Param,
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
    GetAllCompetitionSubmitsUseCase,
    GetCompetitionSubmitByIdUseCase,
    DeleteCompetitionSubmitUseCase,
} from '../../application/use-cases/competition-submit'
import {
    CompetitionSubmitListQueryDto,
    CompetitionSubmitResponseDto,
    CompetitionSubmitListResponseDto,
} from '../../application/dtos/competition-submit'

/**
 * Controller quản lý bài nộp cuộc thi (dành cho admin).
 * Khác với DoCompetitionController (học sinh làm bài),
 * controller này dùng để xem & quản lý kết quả nộp bài từ phía quản trị.
 *
 * ─── ENDPOINTS ───────────────────────────────────────────────────────────────
 *
 * GET  /competition-submits
 *   Lấy danh sách bài nộp có phân trang, lọc theo:
 *   competitionId, studentId, status, attemptNumber, isGraded, startedFrom/To
 *
 * GET  /competition-submits/:id
 *   Lấy chi tiết 1 bài nộp theo ID (bao gồm answers nếu có)
 *
 * DELETE /competition-submits/:id
 *   Xoá bài nộp (admin only, ghi audit log)
 */
@Injectable()
@Controller('competition-submits')
export class CompetitionSubmitController {
    constructor(
        private readonly getAllCompetitionSubmitsUseCase: GetAllCompetitionSubmitsUseCase,
        private readonly getCompetitionSubmitByIdUseCase: GetCompetitionSubmitByIdUseCase,
        private readonly deleteCompetitionSubmitUseCase: DeleteCompetitionSubmitUseCase,
    ) { }

    /**
     * Lấy danh sách bài nộp cuộc thi (admin).
     *
     * @route GET /competition-submits
     *
     * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
     * @query page           Trang hiện tại (mặc định 1)
     * @query limit          Kích thước trang, tối đa 100 (mặc định 10)
     * @query sortBy         Trường sắp xếp (mặc định startedAt)
     * @query sortOrder      Chiều sắp xếp: asc | desc (mặc định desc)
     * @query competitionId  Lọc theo cuộc thi
     * @query studentId      Lọc theo học sinh
     * @query status         Lọc theo trạng thái: IN_PROGRESS | SUBMITTED | GRADED | ABANDONED
     * @query attemptNumber  Lọc theo lần làm thứ N
     * @query isGraded       Lọc bài đã chấm (true/false)
     * @query startedFrom    Lọc từ ngày bắt đầu làm (ISO date string)
     * @query startedTo      Lọc đến ngày bắt đầu làm (ISO date string)
     *
     * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
     * @returns CompetitionSubmitListResponseDto
     *   data.competitionSubmits[] - danh sách bài nộp
     *   data.pagination.{total, page, limit, totalPages}
     */
    @Get()
    @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllCompetitionSubmits(
        @Query() query: CompetitionSubmitListQueryDto,
    ): Promise<CompetitionSubmitListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllCompetitionSubmitsUseCase.execute(query))
    }

    /**
     * Lấy chi tiết 1 bài nộp theo ID.
     *
     * @route GET /competition-submits/:id
     *
     * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
     * @param id  ID của bài nộp (CompetitionSubmit.competitionSubmitId)
     *
     * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
     * @returns BaseResponseDto<CompetitionSubmitResponseDto>
     *   - competitionSubmitId, competitionId, studentId, attemptNumber
     *   - status: IN_PROGRESS | SUBMITTED | GRADED | ABANDONED
     *   - startedAt, submittedAt, gradedAt, timeSpentSeconds
     *   - totalPoints, maxPoints, scorePercentage
     *   - isInProgress, isSubmitted, isGraded, isAbandoned, hasScore
     *   - competition?: thông tin cuộc thi
     *   - student?: thông tin học sinh
     *   - competitionAnswers?: danh sách câu trả lời
     */
    @Get(':id')
    @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getCompetitionSubmitById(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<BaseResponseDto<CompetitionSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.getCompetitionSubmitByIdUseCase.execute(id))
    }

    /**
     * Xoá bài nộp cuộc thi (admin).
     *
     * @route DELETE /competition-submits/:id
     *
     * ─── ĐẦU VÀO ─────────────────────────────────────────────────────────────
     * @param id  ID của bài nộp cần xoá
     *
     * ─── ĐẦU RA ─────────────────────────────────────────────────────────────
     * @returns BaseResponseDto<null> — success: true nếu xoá thành công
     * @throws NotFoundException nếu bài nộp không tồn tại
     */
    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteCompetitionSubmit(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteCompetitionSubmitUseCase.execute(id, adminId))
    }
}
