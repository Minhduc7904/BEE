import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import { Visibility } from '../../../shared/enums'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import {
    PublicStudentCompetitionExamDataDto,
    PublicStudentCompetitionExamQuestionChapterDto,
    PublicStudentCompetitionExamQuestionDto,
    PublicStudentCompetitionExamResponseDto,
    PublicStudentCompetitionExamSectionDto,
    PublicStudentCompetitionExamStatementDto,
} from '../../dtos/competition/public-student-competition-exam.dto'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import {
    EXAM_CONTENT_FIELDS,
    QUESTION_CONTENT_FIELDS,
    SECTION_CONTENT_FIELDS,
} from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetPublicStudentCompetitionExamUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    ) { }

    async execute(
        competitionId: number,
        expirySeconds = 3600,
    ): Promise<PublicStudentCompetitionExamResponseDto> {
        const competition = await this.competitionRepository.findById(competitionId)

        if (!competition) {
            throw new NotFoundException('Public competition not found')
        }

        if (!competition.allowViewExamContent) {
            throw new ForbiddenException('This competition does not allow viewing exam content')
        }

        if (!competition.examId) {
            throw new NotFoundException('Exam not found for this competition')
        }

        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)
        if (!exam) {
            throw new NotFoundException('Exam not found for this competition')
        }

        const sections = await this.buildSections(exam.sections || [], expirySeconds)
        const questions = await this.buildQuestions(exam.questions || [], expirySeconds)

        const data: PublicStudentCompetitionExamDataDto = {
            examId: exam.examId,
            title: exam.title,
            description: exam.description,
            processedDescription: exam.description,
            grade: exam.grade,
            subject: {
                subjectId: exam.subjectId,
                name: exam.subject?.name,
            },
            createdBy: exam.createdBy,
            typeOfExam: exam.typeOfExam,
            sections,
            questions,
        }

        if (data.description) {
            const contentFields: ContentField[] = [
                { fieldName: EXAM_CONTENT_FIELDS.DESCRIPTION, content: data.description },
            ]

            const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)
            data.processedDescription = this.processContentAndRenderHtmlUseCase.getProcessedContent(
                processedResults,
                EXAM_CONTENT_FIELDS.DESCRIPTION,
            ) || data.description
        }

        return {
            success: true,
            message: 'Fetched public competition exam successfully',
            data,
        }
    }

    private async buildSections(sections: any[], expirySeconds: number): Promise<PublicStudentCompetitionExamSectionDto[]> {
        const sectionDtos: PublicStudentCompetitionExamSectionDto[] = sections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((section) => ({
                sectionId: section.sectionId,
                title: section.title,
                description: section.description,
                processedDescription: section.description,
                order: section.order,
            }))

        for (const dto of sectionDtos) {
            if (!dto.description) {
                continue
            }

            const contentFields: ContentField[] = [
                { fieldName: SECTION_CONTENT_FIELDS.DESCRIPTION, content: dto.description },
            ]

            const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)

            dto.processedDescription = this.processContentAndRenderHtmlUseCase.getProcessedContent(
                processedResults,
                SECTION_CONTENT_FIELDS.DESCRIPTION,
            ) || dto.description
        }

        return sectionDtos
    }

    private async buildQuestions(questionExams: any[], expirySeconds: number): Promise<PublicStudentCompetitionExamQuestionDto[]> {
        const sortedQuestionExams = questionExams.slice().sort((a, b) => a.order - b.order)
        const questionDtos: PublicStudentCompetitionExamQuestionDto[] = []

        for (const questionExam of sortedQuestionExams) {
            const question = questionExam.question
            if (!question) {
                continue
            }

            const statements: PublicStudentCompetitionExamStatementDto[] = (question.statements || []).map((stmt: any) => ({
                statementId: stmt.statementId,
                content: stmt.content,
                processedContent: stmt.content,
                order: stmt.order ?? null,
            }))

            const chapters: PublicStudentCompetitionExamQuestionChapterDto[] = (question.questionChapters || []).map((questionChapter: any) => ({
                chapterId: questionChapter.chapterId,
                name: questionChapter.chapter?.name ?? null,
            }))

            const dto: PublicStudentCompetitionExamQuestionDto = {
                questionId: question.questionId,
                sectionId: questionExam.sectionId,
                order: questionExam.order,
                type: question.type,
                content: question.content,
                processedContent: question.content,
                difficulty: question.difficulty,
                pointsOrigin: question.pointsOrigin,
                chapters,
                statements,
            }

            // Keep content-processing logic consistent with GetQuestionsByExamUseCase.
            const contentFields: ContentField[] = [
                { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: dto.content },
            ]

            dto.statements.forEach((stmt, index) => {
                contentFields.push({
                    fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                    content: stmt.content,
                })
            })

            const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)

            dto.processedContent = this.processContentAndRenderHtmlUseCase.getProcessedContent(
                processedResults,
                QUESTION_CONTENT_FIELDS.CONTENT,
            ) || dto.content

            dto.statements.forEach((stmt, index) => {
                stmt.processedContent = this.processContentAndRenderHtmlUseCase.getProcessedContent(
                    processedResults,
                    `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                ) || stmt.content
            })

            questionDtos.push(dto)
        }

        return questionDtos
    }
}
