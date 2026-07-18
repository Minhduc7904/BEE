// src/presentation/controllers/lesson-learning-item.controller.ts
import { Controller, Get, Post, Delete, Put, Query, Param, Body, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { LessonLearningItemListQueryDto } from '../../application/dtos/lessonLearningItem/lesson-learning-item-list-query.dto'
import { CreateLessonLearningItemDto, ReorderLessonLearningItemsDto } from '../../application/dtos/lessonLearningItem'
import { LessonLearningItemListResponseDto, LessonLearningItemResponseDto } from '../../application/dtos/lessonLearningItem/lesson-learning-item.dto'
import {
    StudentLessonLearningItemListResponseDto,
    StudentLessonLearningItemResponseDto,
} from '../../application/dtos/lessonLearningItem'
import { StudentLearnedLearningItemsQueryDto } from '../../application/dtos/lessonLearningItem/student-learned-learning-items-query.dto'
import { StudentLearnedLearningItemResponseDto } from '../../application/dtos/lessonLearningItem/student-learned-learning-item.dto'
import { PaginationResponseDto } from '../../application/dtos/pagination/pagination-response.dto'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
    GetAllLessonLearningItemUseCase,
    GetLessonLearningItemByIdUseCase,
    CreateLessonLearningItemUseCase,
    DeleteLessonLearningItemUseCase,
    ReorderLessonLearningItemsUseCase,
    GetStudentLessonLearningItemsUseCase,
    GetStudentLearnedLearningItemsUseCase,
    GetStudentLessonLearningItemByIdUseCase,
} from '../../application/use-cases/lessonLearningItem'
import { Injectable } from '@nestjs/common'

@Injectable()
@Controller('lesson-learning-items')
export class LessonLearningItemController {
    constructor(
        private readonly getAllLessonLearningItemUseCase: GetAllLessonLearningItemUseCase,
        private readonly getLessonLearningItemByIdUseCase: GetLessonLearningItemByIdUseCase,
        private readonly createLessonLearningItemUseCase: CreateLessonLearningItemUseCase,
        private readonly deleteLessonLearningItemUseCase: DeleteLessonLearningItemUseCase,
        private readonly reorderLessonLearningItemsUseCase: ReorderLessonLearningItemsUseCase,
        private readonly getStudentLessonLearningItemsUseCase: GetStudentLessonLearningItemsUseCase,
        private readonly getStudentLearnedLearningItemsUseCase: GetStudentLearnedLearningItemsUseCase,
        private readonly getStudentLessonLearningItemByIdUseCase: GetStudentLessonLearningItemByIdUseCase,
    ) { }

    @Get()
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAllLessonLearningItems(@Query() query: LessonLearningItemListQueryDto): Promise<LessonLearningItemListResponseDto> {
        return ExceptionHandler.execute(() => this.getAllLessonLearningItemUseCase.execute(query))
    }

    /**
     * Get all learning items of a public lesson for current student.
     * GET /lesson-learning-items/student/lesson/:lessonId
     *
     * Rule:
     * - Lesson phải có visibility = PUBLISHED.
     * - Student phải có enrollment ACTIVE trong course của lesson.
     * - Mỗi learningItem join thêm bản ghi students_learning_items của student hiện tại.
     * - Nếu student chưa học item thì studentLearningItem = null, isLearned = false.
     *
     * Input:
     * - lessonId: ID của lesson cần lấy danh sách mục học tập.
     * - studentId: ID của student lấy từ token đăng nhập.
     *
     * Output:
     * - Danh sách lesson_learning_items kèm learningItem và progress của student.
     */
    @Get('student/lesson/:lessonId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentLessonLearningItems(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<StudentLessonLearningItemListResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getStudentLessonLearningItemsUseCase.execute(lessonId, studentId),
        )
    }

    /**
     * Learning items marked as learned by the current student and visible via class access.
     * GET /lesson-learning-items/student/learned
     */
    @Get('student/learned')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentLearnedLearningItems(
        @Query() query: StudentLearnedLearningItemsQueryDto,
        @CurrentUser('studentId') studentId: number,
    ): Promise<PaginationResponseDto<StudentLearnedLearningItemResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getStudentLearnedLearningItemsUseCase.execute(studentId, query),
        )
    }

    /**
     * Get one learning item of a public lesson for current student.
     * GET /lesson-learning-items/student/:lessonId/:learningItemId
     *
     * Rule:
     * - Lesson phải có visibility = PUBLISHED.
     * - Student phải có enrollment ACTIVE trong course của lesson.
     * - Learning item phải thuộc lesson qua bảng lesson_learning_items.
     * - Learning item join thêm bản ghi students_learning_items của student hiện tại.
     *
     * Input:
     * - lessonId: ID của lesson.
     * - learningItemId: ID của mục học tập.
     * - studentId: ID của student lấy từ token đăng nhập.
     *
     * Output:
     * - Một lesson_learning_item kèm learningItem và progress của student.
     */
    @Get('student/:lessonId/:learningItemId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getStudentLessonLearningItemById(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentLessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.getStudentLessonLearningItemByIdUseCase.execute(lessonId, learningItemId, studentId),
        )
    }

    @Get(':lessonId/:learningItemId')
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getLessonLearningItemById(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number
    ): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.getLessonLearningItemByIdUseCase.execute(lessonId, learningItemId))
    }

    @Post()
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.CREATE)
    @HttpCode(HttpStatus.CREATED)
    async createLessonLearningItem(
        @Body() dto: CreateLessonLearningItemDto
    ): Promise<BaseResponseDto<LessonLearningItemResponseDto>> {
        return ExceptionHandler.execute(() => this.createLessonLearningItemUseCase.execute(dto))
    }

    /**
     * Cập nhật lại thứ tự cho nhiều LessonLearningItem
     * PUT /lesson-learning-items/reorder
     */
    @Put('reorder')
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.UPDATE)
    @HttpCode(HttpStatus.OK)
    async reorderLessonLearningItems(
        @Body() dto: ReorderLessonLearningItemsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return ExceptionHandler.execute(() =>
            this.reorderLessonLearningItemsUseCase.execute(dto),
        )
    }

    @Delete(':lessonId/:learningItemId')
    @RequirePermission(PERMISSION_CODES.LESSON_LEARNING_ITEM.DELETE)
    @HttpCode(HttpStatus.OK)
    async deleteLessonLearningItem(
        @Param('lessonId', ParseIntPipe) lessonId: number,
        @Param('learningItemId', ParseIntPipe) learningItemId: number
    ): Promise<BaseResponseDto<null>> {
        return ExceptionHandler.execute(() => this.deleteLessonLearningItemUseCase.execute(lessonId, learningItemId))
    }
}
