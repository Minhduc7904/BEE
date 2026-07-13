import { Inject, Injectable } from '@nestjs/common'
import type { IHomeworkContentRepository } from 'src/domain/repositories/homework-content.repository'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'
import { HomeworkContentType } from 'src/shared/enums'
import {
  BusinessLogicException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from 'src/shared/exceptions/custom-exceptions'
import { HomeworkContent } from 'src/domain/entities'

@Injectable()
export class StudentFileHomeworkAccessService {
  constructor(
    @Inject('IHomeworkContentRepository')
    private readonly homeworkContentRepository: IHomeworkContentRepository,
    private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
  ) {}

  async getAccessibleHomework(
    homeworkContentId: number,
    studentId: number,
  ): Promise<HomeworkContent> {
    const homeworkContent = await this.homeworkContentRepository.findById(homeworkContentId)
    if (!homeworkContent) {
      throw new NotFoundException('Không tìm thấy nội dung bài tập')
    }

    if (homeworkContent.type !== HomeworkContentType.FILE_UPLOAD) {
      throw new ConflictException('API này chỉ áp dụng cho bài tập có type FILE_UPLOAD')
    }

    const accessibleLesson =
      await this.studentClassLessonAccessService.findAccessibleLessonForLearningItem(
        homeworkContent.learningItemId,
        studentId,
      )

    if (!accessibleLesson) {
      throw new ForbiddenException('Bạn không có quyền truy cập bài tập này')
    }

    return homeworkContent
  }

  assertCanSubmit(homeworkContent: HomeworkContent): void {
    if (homeworkContent.isOverdue() && !homeworkContent.allowLateSubmit) {
      throw new BusinessLogicException('Bài tập đã quá hạn nộp')
    }
  }
}
