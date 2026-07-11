import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLearningItemStateResponseDto } from '../../dtos/studentLearningItem'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'
import type { IUnitOfWork } from 'src/domain/repositories'
import { StudentPointService } from 'src/application/services/student-point.service'

@Injectable()
export class MarkStudentLearningItemLearnedUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
        private readonly studentPointService: StudentPointService,
    ) { }

    async execute(
        studentId: number,
        learningItemId: number,
    ): Promise<BaseResponseDto<StudentLearningItemStateResponseDto>> {
        const accessibleLessonLearningItem =
            await this.studentClassLessonAccessService.findAccessibleLessonForLearningItem(
                learningItemId,
                studentId,
            )

        if (!accessibleLessonLearningItem) {
            throw new NotFoundException('Không tìm thấy mục học tập')
        }

        const studentLearningItem = await this.unitOfWork.executeInTransaction(async (repos) => {
            const existing = await repos.studentLearningItemRepository.findByCompositeId(studentId, learningItemId)
            const learnedAt = existing?.learnedAt ?? new Date()

            const saved = existing
                ? await repos.studentLearningItemRepository.update(studentId, learningItemId, {
                    isLearned: true,
                    learnedAt,
                })
                : await repos.studentLearningItemRepository.create({
                    studentId,
                    learningItemId,
                    isLearned: true,
                    learnedAt,
                })

            await this.studentPointService.awardLearningItemLearnedPoints(repos, {
                studentId,
                learningItemId,
                learnedAt: saved.learnedAt,
            })

            return saved
        })

        return BaseResponseDto.success(
            'Đánh dấu đã học mục học tập thành công',
            StudentLearningItemStateResponseDto.fromPrisma(studentLearningItem)!,
        )
    }
}
