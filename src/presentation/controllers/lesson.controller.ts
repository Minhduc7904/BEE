// src/presentation/controllers/lesson.controller.ts
import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LessonListQueryDto } from '../../application/dtos/lesson/lesson-list-query.dto'
import { CreateLessonDto } from '../../application/dtos/lesson/create-lesson.dto'
import { UpdateLessonDto } from '../../application/dtos/lesson/update-lesson.dto'
import { LessonListResponseDto, LessonResponseDto } from '../../application/dtos/lesson/lesson.dto'
import { StudentLessonResponseDto } from '../../application/dtos/lesson/student-lesson.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import {
    GetAllLessonUseCase,
    GetLessonByIdUseCase,
    CreateLessonUseCase,
    UpdateLessonUseCase,
    DeleteLessonUseCase,
    GetStudentCourseLessonsUseCase,
    GetStudentLessonByIdUseCase,
} from '../../application/use-cases/lesson'
import { Injectable } from '@nestjs/common'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Injectable()
@Controller('lessons')
export class LessonController {
    constructor(
        private readonly getAllLessonUseCase: GetAllLessonUseCase,
        private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
        private readonly createLessonUseCase: CreateLessonUseCase,
        private readonly updateLessonUseCase: UpdateLessonUseCase,
        private readonly deleteLessonUseCase: DeleteLessonUseCase,
        private readonly getStudentCourseLessonsUseCase: GetStudentCourseLessonsUseCase,
        private readonly getStudentLessonByIdUseCase: GetStudentLessonByIdUseCase,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_CODES.LESSON.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllLessons(@Query() query: LessonListQueryDto): Promise<LessonListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLessonUseCase.execute(query))
    }

    /**
     * Get all public lessons for a course (for student)
     * GET /lessons/student/course/:courseId
     *
     * Rule:
     * - Course phải tồn tại và không được ở trạng thái DRAFT.
     * - Student phải có enrollment ACTIVE trong course.
     * - Chỉ trả về lesson có visibility = PUBLISHED.
     * - Lesson có visibility = DRAFT hoặc PRIVATE sẽ không được trả về.
     *
     * Input:
     * - courseId: ID của course cần lấy danh sách lesson.
     * - studentId: ID của student lấy từ token đăng nhập.
     *
     * Output:
     * - Danh sách lesson public của course.
     * - Bao gồm chapters, learningItems, student progress và % hoàn thành từng lesson.
     * - Sắp xếp theo orderInCourse tăng dần.
     */
    @Get('student/course/:courseId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentCourseLessons(
        @Param('courseId', ParseIntPipe) courseId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentLessonResponseDto[]>> {
        return ExceptionHandler.execute(() => 
            this.getStudentCourseLessonsUseCase.execute(courseId, studentId)
        )
    }

    /**
     * Get a single public lesson by ID (for student)
     * GET /lessons/:id/student
     *
     * Rule:
     * - Lesson phải tồn tại.
     * - Lesson phải có visibility = PUBLISHED.
     * - Lesson có visibility = DRAFT hoặc PRIVATE sẽ không được trả về.
     * - Course của lesson phải tồn tại.
     * - Student phải có enrollment ACTIVE trong course của lesson.
     *
     * Input:
     * - id: ID của lesson cần lấy chi tiết.
     * - studentId: ID của student lấy từ token đăng nhập.
     *
     * Output:
     * - Thông tin chi tiết lesson public.
     * - Bao gồm chapters, learningItems, student progress và % hoàn thành lesson.
     */
    @Get(':id/student')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentLessonById(
        @Param('id', ParseIntPipe) lessonId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentLessonResponseDto>> {
        return ExceptionHandler.execute(() => 
            this.getStudentLessonByIdUseCase.execute(lessonId, studentId)
        )
    }

    @Get(':id')
    @RequirePermission(PERMISSION_CODES.LESSON.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getLessonById(
        @Param('id', ParseIntPipe) id: number,
        @Query('courseId', new ParseIntPipe({ optional: true })) courseId?: number,
    ): Promise<BaseResponseDto<LessonResponseDto>> {
        return ExceptionHandler.execute(() => this.getLessonByIdUseCase.execute(id, courseId))
    }



    @Post()
    @RequirePermission(PERMISSION_CODES.LESSON.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createLesson(
        @Body() dto: CreateLessonDto
    ): Promise<BaseResponseDto<LessonResponseDto>> {
        return ExceptionHandler.execute(() => this.createLessonUseCase.execute(dto))
    }

    @Put(':id')
    @RequirePermission(PERMISSION_CODES.LESSON.UPDATE)
    @HttpCode(HttpStatus.OK)
    async updateLesson(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateLessonDto
    ): Promise<BaseResponseDto<LessonResponseDto>> {
        return ExceptionHandler.execute(() => this.updateLessonUseCase.execute(id, dto))
    }

    @Delete(':id')
    @RequirePermission(PERMISSION_CODES.LESSON.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteLesson(
        @Param('id', ParseIntPipe) id: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLessonUseCase.execute(id))
    }
}
