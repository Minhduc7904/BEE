import { Controller, Get, Put, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Query } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { BaseResponseDto, StudentResponseDto, UpdateStudentDto } from '../../application/dtos'
import { MediaResponseDto } from '../../application/dtos/media'
import { ChangePasswordDto } from '../../application/dtos/profile/change-password.dto'
import { StudentDifficultyProgressResponseDto } from '../../application/dtos/profile/student-difficulty-progress-response.dto'
import { StudentYearlyActivityResponseDto } from '../../application/dtos/profile/student-yearly-activity-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly, CurrentUser } from '../../shared/decorators'
import {
    GetStudentProfileUseCase,
    UpdateStudentProfileUseCase,
    UploadStudentAvatarUseCase,
    ChangeStudentPasswordUseCase,
    GetStudentDifficultyProgressUseCase,
    GetStudentYearlyActivityUseCase,
} from '../../application/use-cases'

@Controller('student/profile')
export class ProfileStudentController {
    constructor(
        private readonly getStudentProfileUseCase: GetStudentProfileUseCase,
        private readonly updateStudentProfileUseCase: UpdateStudentProfileUseCase,
        private readonly uploadStudentAvatarUseCase: UploadStudentAvatarUseCase,
        private readonly changeStudentPasswordUseCase: ChangeStudentPasswordUseCase,
        private readonly getStudentDifficultyProgressUseCase: GetStudentDifficultyProgressUseCase,
        private readonly getStudentYearlyActivityUseCase: GetStudentYearlyActivityUseCase,
    ) { }

    private parseStudentId(studentId?: string): number | undefined {
        if (!studentId) return undefined

        const parsed = Number(studentId)
        if (!Number.isInteger(parsed) || parsed <= 0) return undefined

        return parsed
    }

    /**
     * Get student profile
     * GET /student/profile
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async getProfile(
        @CurrentUser('userId') userId: number,
        @Query('studentId') studentId?: string,
    ): Promise<BaseResponseDto<StudentResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getStudentProfileUseCase.execute({
                userId,
                studentId: this.parseStudentId(studentId),
            }),
        )
    }

    /**
     * Update student profile
     * PUT /student/profile
     */
    @Put()
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async updateProfile(
        @CurrentUser('userId') userId: number,
        @Body() updateDto: UpdateStudentDto,
    ): Promise<BaseResponseDto<StudentResponseDto>> {
        return ExceptionHandler.execute(() => this.updateStudentProfileUseCase.execute(userId, updateDto))
    }

    /**
     * Upload student avatar
     * POST /student/profile/avatar
     */
    @Post('avatar')
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('userId') userId: number,
    ): Promise<BaseResponseDto<MediaResponseDto>> {
        return ExceptionHandler.execute(() => this.uploadStudentAvatarUseCase.execute(file, userId))
    }

    /**
     * Change student password
     * PUT /student/profile/change-password
     */
    @Put('change-password')
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async changePassword(
        @CurrentUser('userId') userId: number,
        @Body() dto: ChangePasswordDto,
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.changeStudentPasswordUseCase.execute(userId, dto))
    }

    /**
     * Get student progress stats by difficulty
     * GET /student/profile/stats/difficulty
        *
        * Response example:
        * {
        *   "success": true,
        *   "message": "Lấy thống kê tiến độ theo độ khó thành công",
        *   "data": {
        *     "totalDone": 58,
        *     "totalQuestions": 120,
        *     "overallPercentage": 48.33,
        *     "items": [
        *       {
        *         "difficulty": "NB",
        *         "label": "Nhận biết",
        *         "done": 20,
        *         "total": 40,
        *         "percentage": 50
        *       },
        *       {
        *         "difficulty": "TH",
        *         "label": "Thông hiểu",
        *         "done": 18,
        *         "total": 35,
        *         "percentage": 51.43
        *       },
        *       {
        *         "difficulty": "VD",
        *         "label": "Vận dụng",
        *         "done": 12,
        *         "total": 25,
        *         "percentage": 48
        *       },
        *       {
        *         "difficulty": "VDC",
        *         "label": "Vận dụng cao",
        *         "done": 8,
        *         "total": 20,
        *         "percentage": 40
        *       }
        *     ]
        *   }
        * }
     */
    @Get('stats/difficulty')
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async getDifficultyStats(
        @CurrentUser('userId') userId: number,
        @Query('studentId') studentId?: string,
    ): Promise<BaseResponseDto<StudentDifficultyProgressResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getStudentDifficultyProgressUseCase.execute({
                userId,
                studentId: this.parseStudentId(studentId),
            }),
        )
    }

    /**
     * Get student daily activity totals in a year (competition submit + exam attempt)
     * GET /student/profile/stats/activity-year?year=2026
        *
        * Response example:
        * {
        *   "success": true,
        *   "message": "Lấy thống kê hoạt động theo ngày trong năm thành công",
        *   "data": {
        *     "year": 2026,
        *     "totalCompetitionSubmits": 142,
        *     "totalExamAttempts": 96,
        *     "totalActivities": 238,
        *     "totalActiveDays": 84,
        *     "maxStreak": 7,
        *     "days": [
        *       {
        *         "date": "2026-01-01",
        *         "competitionSubmitCount": 1,
        *         "examAttemptCount": 0,
        *         "totalCount": 1
        *       },
        *       {
        *         "date": "2026-01-02",
        *         "competitionSubmitCount": 0,
        *         "examAttemptCount": 2,
        *         "totalCount": 2
        *       },
        *       {
        *         "date": "2026-01-03",
        *         "competitionSubmitCount": 0,
        *         "examAttemptCount": 0,
        *         "totalCount": 0
        *       }
        *     ]
        *   }
        * }
     */
    @Get('stats/activity-year')
    @HttpCode(HttpStatus.OK)
    @AuthOnly()
    async getYearlyActivityStats(
        @CurrentUser('userId') userId: number,
        @Query('year') year?: string,
        @Query('studentId') studentId?: string,
    ): Promise<BaseResponseDto<StudentYearlyActivityResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getStudentYearlyActivityUseCase.execute(
                {
                    userId,
                    studentId: this.parseStudentId(studentId),
                },
                year,
            ),
        )
    }
}
