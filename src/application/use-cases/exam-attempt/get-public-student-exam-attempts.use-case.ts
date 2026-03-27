import { Inject, Injectable } from '@nestjs/common'
import type { IExamAttemptRepository, IStudentRepository } from '../../../domain/repositories'
import { StudentExamAttemptListQueryDto } from '../../dtos/exam-attempt/student-exam-attempt-list-query.dto'
import {
    StudentExamAttemptItemDto,
    StudentExamAttemptListResponseDto,
} from '../../dtos/exam-attempt/student-exam-attempt.dto'
import {
    ForbiddenException,
    NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetPublicStudentExamAttemptsUseCase {
    constructor(
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
    ) { }

    async execute(
        studentId: number,
        query: StudentExamAttemptListQueryDto,
    ): Promise<StudentExamAttemptListResponseDto> {
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

        const result = await this.examAttemptRepository.findPublicByStudentWithPagination(
            studentId,
            pagination,
            {
                examId: query.examId,
                status: query.status,
            },
        )

        const examAttempts = result.examAttempts.map((item) => StudentExamAttemptItemDto.fromEntity(item))

        return StudentExamAttemptListResponseDto.fromResult(
            examAttempts,
            result.page,
            result.limit,
            result.total,
        )
    }
}
