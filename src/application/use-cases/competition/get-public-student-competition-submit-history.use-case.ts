import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionSubmitRepository, IStudentRepository } from '../../../domain/repositories'
import { StudentCompetitionHistoryQueryDto } from '../../dtos/competition-submit/student-competition-history-query.dto'
import {
    StudentCompetitionHistoryItemDto,
    StudentCompetitionHistoryListResponseDto,
} from '../../dtos/competition-submit/student-competition-history.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    ForbiddenException,
    NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetPublicStudentCompetitionSubmitHistoryUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(
        studentId: number,
        query: StudentCompetitionHistoryQueryDto,
    ): Promise<StudentCompetitionHistoryListResponseDto> {
        const student = await this.studentRepository.findById(studentId)

        if (!student) {
            throw new NotFoundException('Student profile not found')
        }

        if (!student.user?.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
        }

        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const result = await this.competitionSubmitRepository.findPublicStudentHistory(
            studentId,
            pagination,
        )

        const history = result.competitionSubmits.map((item) => {
            const canViewDetail = !!(
                item.competition?.allowViewAnswer || item.competition?.showResultDetail
            )

            return StudentCompetitionHistoryItemDto.fromEntity(item, canViewDetail)
        })

        return BaseResponseDto.success('Lấy danh sách bài đã nộp của cuộc thi công khai thành công', {
            history,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        })
    }
}
