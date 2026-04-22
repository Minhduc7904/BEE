import { Injectable } from '@nestjs/common'
import { QuestionListQueryDto } from '../../dtos/question/question-list-query.dto'
import { QuestionListResponseDto } from '../../dtos/question/question.dto'
import { Visibility } from '../../../shared/enums'
import { GetAllQuestionsUseCase } from './get-all-questions.use-case'

@Injectable()
export class SearchPublicStudentQuestionsUseCase {
    constructor(
        private readonly getAllQuestionsUseCase: GetAllQuestionsUseCase,
    ) { }

    async execute(
        query: QuestionListQueryDto,
        studentId?: number,
        expirySeconds = 3600,
    ): Promise<QuestionListResponseDto> {
        return this.getAllQuestionsUseCase.execute(query, expirySeconds, studentId, true)
    }
}
