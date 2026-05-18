import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { ExamVisibility } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import {
    PublicStudentCompetitionExamDataDto,
    PublicStudentCompetitionExamQuestionChapterDto,
    PublicStudentCompetitionExamQuestionDto,
    PublicStudentCompetitionExamResponseDto,
    PublicStudentCompetitionExamSectionDto,
    PublicStudentCompetitionExamStatementDto,
} from '../../dtos/competition/public-student-competition-exam.dto'
import { PublicStudentExamContentQueryDto } from '../../dtos/exam'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import {
    EXAM_CONTENT_FIELDS,
    QUESTION_CONTENT_FIELDS,
    SECTION_CONTENT_FIELDS,
} from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetPublicStudentExamContentUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    ) { }

    async execute(
        examId: number,
        query?: PublicStudentExamContentQueryDto,
        expirySeconds = 3600,
    ): Promise<PublicStudentCompetitionExamResponseDto> {
        const exam = await this.examRepository.findByIdWithFullDetails(examId)

        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        if (exam.visibility !== ExamVisibility.PUBLISHED) {
            throw new ForbiddenException('Chỉ được xem nội dung đề thi public')
        }

        const questionExams = this.filterQuestionExamsByQuestionIds(
            this.collectQuestionExams(exam),
            query?.questionIds,
        )
        const sections = await this.buildSections(
            this.filterSectionsByQuestionExams(exam.sections || [], questionExams, query?.questionIds),
            expirySeconds,
        )
        const questions = await this.buildQuestions(questionExams, expirySeconds)

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
            message: 'Lấy nội dung đề thi public thành công',
            data,
        }
    }

    private collectQuestionExams(exam: any): any[] {
        const examLevelQuestions: any[] = Array.isArray(exam.questions) ? exam.questions : []
        const sectionLevelQuestions: any[] = Array.isArray(exam.sections)
            ? exam.sections.flatMap((section: any) =>
                Array.isArray(section?.questions) ? section.questions : [],
            )
            : []

        const combined = [...examLevelQuestions, ...sectionLevelQuestions]
        const uniqueMap = new Map<string, any>()

        for (const item of combined) {
            if (!item?.questionId) {
                continue
            }

            const key = `${item.questionId}-${item.sectionId ?? 'null'}-${item.order ?? 'null'}`
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item)
            }
        }

        return Array.from(uniqueMap.values())
    }

    private filterQuestionExamsByQuestionIds(questionExams: any[], questionIds?: number[]): any[] {
        if (!questionIds || questionIds.length === 0) {
            return questionExams
        }

        const questionIdSet = new Set(questionIds)
        return questionExams.filter((item) => questionIdSet.has(item.questionId))
    }

    private filterSectionsByQuestionExams(sections: any[], questionExams: any[], questionIds?: number[]): any[] {
        if (!questionIds || questionIds.length === 0) {
            return sections
        }

        const sectionIdSet = new Set(
            questionExams
                .map((item) => item?.sectionId)
                .filter((sectionId) => sectionId !== null && sectionId !== undefined),
        )

        return sections.filter((section) => sectionIdSet.has(section.sectionId))
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
                slug: question.slug,
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
