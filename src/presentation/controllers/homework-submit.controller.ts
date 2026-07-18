// src/presentation/controllers/homework-submit.controller.ts
import { Controller, Get, Post, Put, Delete, Patch, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { HomeworkSubmitListQueryDto } from '../../application/dtos/homeworkSubmit/homework-submit-list-query.dto'
import { CreateHomeworkSubmitDto } from '../../application/dtos/homeworkSubmit/create-homework-submit.dto'
import { CreateHomeworkSubmitFromCompetitionDto } from '../../application/dtos/homeworkSubmit/create-homework-submit-from-competition.dto'
import { UpdateHomeworkSubmitCompetitionDto } from '../../application/dtos/homeworkSubmit/update-homework-submit-competition.dto'
import { UpdateHomeworkSubmitDto } from '../../application/dtos/homeworkSubmit/update-homework-submit.dto'
import { GradeHomeworkSubmitDto } from '../../application/dtos/homeworkSubmit/grade-homework-submit.dto'
import { HomeworkSubmitListResponseDto, HomeworkSubmitResponseDto } from '../../application/dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllHomeworkSubmitUseCase,
    GetStudentHomeworkSubmitsUseCase,
    GetHomeworkSubmitByIdUseCase,
    CreateHomeworkSubmitUseCase,
    CreateHomeworkSubmitFromCompetitionUseCase,
    GetSubmittedCompetitionAttemptsByStudentUseCase,
    UpdateHomeworkSubmitCompetitionUseCase,
    UpdateHomeworkSubmitUseCase,
    DeleteHomeworkSubmitUseCase,
    GradeHomeworkSubmitUseCase,
} from '../../application/use-cases/homeworkSubmit'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from 'src/shared/decorators'
import { StudentHomeworkSubmitListQueryDto } from '../../application/dtos/homeworkSubmit/student-homework-submit-list-query.dto'

@Injectable()
@Controller('homework-submits')
export class HomeworkSubmitController {
    constructor(
        private readonly getAllHomeworkSubmitUseCase: GetAllHomeworkSubmitUseCase,
        private readonly getStudentHomeworkSubmitsUseCase: GetStudentHomeworkSubmitsUseCase,
        private readonly getHomeworkSubmitByIdUseCase: GetHomeworkSubmitByIdUseCase,
        private readonly createHomeworkSubmitUseCase: CreateHomeworkSubmitUseCase,
        private readonly createHomeworkSubmitFromCompetitionUseCase: CreateHomeworkSubmitFromCompetitionUseCase,
        private readonly getSubmittedCompetitionAttemptsByStudentUseCase: GetSubmittedCompetitionAttemptsByStudentUseCase,
        private readonly updateHomeworkSubmitCompetitionUseCase: UpdateHomeworkSubmitCompetitionUseCase,
        private readonly updateHomeworkSubmitUseCase: UpdateHomeworkSubmitUseCase,
        private readonly deleteHomeworkSubmitUseCase: DeleteHomeworkSubmitUseCase,
        private readonly gradeHomeworkSubmitUseCase: GradeHomeworkSubmitUseCase,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllHomeworkSubmits(@Query() query: HomeworkSubmitListQueryDto): Promise<HomeworkSubmitListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllHomeworkSubmitUseCase.execute(query))
    }

    /**
     * Get a paginated homework-submit list for one student.
     *
     * Request:
     *   GET /api/homework-submits/student/25?page=1&limit=20&isGraded=true&competitionId=8&sortBy=gradedAt&sortOrder=desc
     *
     * Supported filters:
     * - homeworkContentId, competitionId, graderId, isGraded.
     * - submittedFrom and submittedTo as ISO dates (YYYY-MM-DD is accepted).
     * - search matches submission content, feedback, homework title, or competition title.
     * - sortBy: submitAt | gradedAt | points | createdAt | updatedAt.
     * - sortOrder: asc | desc.
     *
     * Performance contract:
     * - Uses a narrow Prisma select and only returns competitionId/title.
     * - Does not load CompetitionSubmit.answers, Questions, Statements, or media attachments.
     *
     * Example response:
     * {
     *   "success": true,
     *   "data": {
     *     "student": { "studentId": 25, "fullName": "Nguyen Van A" },
     *     "homeworkSubmits": [{
     *       "homeworkSubmitId": 99,
     *       "points": 8.5,
     *       "competition": { "competitionId": 8, "title": "Kiem tra chuong 1" },
     *       "homeworkContent": { "homeworkContentId": 12, "learningItem": { "learningItemId": 34, "title": "Bai tap 1" } }
     *     }],
     *     "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
     *   }
     * }
     */
    @Get('student/:studentId')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GET_BY_STUDENT)
    @HttpCode(HttpStatus.OK)
    async getStudentHomeworkSubmits(
        @Param('studentId', ParseIntPipe) studentId: number,
        @Query() query: StudentHomeworkSubmitListQueryDto,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() => this.getStudentHomeworkSubmitsUseCase.execute(studentId, query))
    }
    
    @Get('students/:studentId/competition-attempts')
    @RequirePermission(PERMISSION_CODES.COMPETITION_SUBMIT.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getSubmittedCompetitionAttemptsByStudent(
        @Param('studentId', ParseIntPipe) studentId: number,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() => this.getSubmittedCompetitionAttemptsByStudentUseCase.execute(studentId))
    }

    @Get(':id')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getHomeworkSubmitById(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.getHomeworkSubmitByIdUseCase.execute(id))
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createHomeworkSubmit(
        @Body() dto: CreateHomeworkSubmitDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.createHomeworkSubmitUseCase.execute(dto, adminId))
    }

    @Post('from-competition')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createHomeworkSubmitFromCompetition(
        @Body() dto: CreateHomeworkSubmitFromCompetitionDto,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() => this.createHomeworkSubmitFromCompetitionUseCase.execute(dto))
    }

    @Patch(':id/competition-submit')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateHomeworkSubmitCompetition(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHomeworkSubmitCompetitionDto,
    ): Promise<BaseResponseDto<any>> {
        return ExceptionHandler.execute(() => this.updateHomeworkSubmitCompetitionUseCase.execute(id, dto))
    }

    @Put(':id')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateHomeworkSubmit(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateHomeworkSubmitDto,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.updateHomeworkSubmitUseCase.execute(id, dto, adminId))
    }

    @Patch(':id/grade')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.GRADE)
    @HttpCode(HttpStatus.OK)
    async gradeHomeworkSubmit(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: GradeHomeworkSubmitDto,
    ): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        return ExceptionHandler.execute(() => this.gradeHomeworkSubmitUseCase.execute(id, dto))
    }

    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.HOMEWORK_SUBMIT.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteHomeworkSubmit(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser('adminId') adminId: number,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteHomeworkSubmitUseCase.execute(id, adminId))
    }
}
