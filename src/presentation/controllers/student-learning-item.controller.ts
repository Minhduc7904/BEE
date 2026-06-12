import { Controller, Post, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { StudentLearningItemStateResponseDto } from '../../application/dtos/studentLearningItem'
import { MarkStudentLearningItemLearnedUseCase } from '../../application/use-cases/studentLearningItem'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

@Controller('student-learning-items')
export class StudentLearningItemController {
    constructor(
        private readonly markStudentLearningItemLearnedUseCase: MarkStudentLearningItemLearnedUseCase,
    ) { }

    /**
     * Mark current student's learning item as learned.
     * POST /student-learning-items/:learningItemId/mark-learned
     *
     * Rule:
     * - Learning item phải tồn tại trong ít nhất một lesson có visibility = PUBLISHED.
     * - Student phải có enrollment ACTIVE trong course của lesson public đó.
     * - API chỉ đánh dấu cho student lấy từ token đăng nhập, không nhận studentId từ body.
     * - Nếu đã đánh dấu trước đó thì giữ nguyên learnedAt hiện có.
     *
     * Input:
     * - learningItemId: ID của mục học tập cần đánh dấu đã học.
     * - studentId: ID của student lấy từ token đăng nhập.
     *
     * Output:
     * - Bản ghi students_learning_items gồm studentId, learningItemId, isLearned, learnedAt, createdAt, updatedAt.
     */
    @Post(':learningItemId/mark-learned')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async markLearned(
        @Param('learningItemId', ParseIntPipe) learningItemId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentLearningItemStateResponseDto>> {
        return ExceptionHandler.execute(() =>
            this.markStudentLearningItemLearnedUseCase.execute(studentId, learningItemId),
        )
    }
}
