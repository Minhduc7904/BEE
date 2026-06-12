import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common'
import {
  CourseClassLessonResponseDto,
  UpsertCourseClassLessonVisibilityDto,
} from '../../application/dtos/courseClassLesson'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { UpsertCourseClassLessonVisibilityUseCase } from '../../application/use-cases/courseClassLesson'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

@Controller('course-class-lessons')
export class CourseClassLessonController {
  constructor(
    private readonly upsertCourseClassLessonVisibilityUseCase: UpsertCourseClassLessonVisibilityUseCase,
  ) { }

  /**
   * Upsert cấu hình hiển thị bài học theo lớp cho nút switch frontend.
   * PUT /course-class-lessons/switch
   *
   * Rule:
   * - Nếu chưa có bản ghi (classId, lessonId) trong course_class_lessons thì tạo mới.
   * - Nếu đã có bản ghi thì cập nhật bản ghi đó.
   * - classId và lessonId phải thuộc cùng một course.
   * - Nếu không có bản ghi class-lesson thì student được xem lesson theo rule public mặc định.
   * - Nếu có bản ghi thì isVisible=false là khóa, isVisible=true là mở.
   * - availableFrom/availableUntil nếu có sẽ giới hạn thời gian được xem.
   *
   * Input:
   * - classId: ID lớp học.
   * - lessonId: ID bài học.
   * - isVisible: trạng thái switch, true là cho xem, false là ẩn/khóa.
   * - displayOrder: thứ tự hiển thị tùy chọn.
   * - availableFrom: thời gian bắt đầu hiển thị tùy chọn.
   * - availableUntil: thời gian kết thúc hiển thị tùy chọn.
   *
   * Output:
   * - Bản ghi course_class_lessons sau khi tạo/cập nhật.
   * - action = CREATED hoặc UPDATED.
   */
  @Put('switch')
  @RequirePermission(PERMISSION_CODES.COURSE_CLASS.UPDATE)
  @HttpCode(HttpStatus.OK)
  async switchVisibility(
    @Body() dto: UpsertCourseClassLessonVisibilityDto,
  ): Promise<BaseResponseDto<CourseClassLessonResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.upsertCourseClassLessonVisibilityUseCase.execute(dto),
    )
  }
}
