import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PublicStudentExamDetailResponseDto } from '../../dtos/exam/exam.dto'
import { ExamVisibility } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { type ContentField, type ProcessedContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { EXAM_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { GetPublicStudentExamContentUseCase } from './get-public-student-exam-content.use-case'
import { QuestionType } from '../../../shared/enums/question-type.enum'

@Injectable()
export class GetPublicStudentExamBySlugUseCase {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    private readonly getPublicStudentExamContentUseCase: GetPublicStudentExamContentUseCase,
  ) {}

  async execute(
    slug: string,
    _studentId?: number,
    expirySeconds = 3600,
  ): Promise<BaseResponseDto<PublicStudentExamDetailResponseDto>> {
    const exam = await this.examRepository.findBySlug(slug)

    if (!exam) {
      throw new NotFoundException('Khong tim thay de thi')
    }

    if (exam.visibility !== ExamVisibility.PUBLISHED) {
      throw new ForbiddenException('Chi duoc xem chi tiet de thi public')
    }

    const seoDescription = this.buildSeoDescription(exam.title, exam.description)
    const contentFields: ContentField[] = [
      { fieldName: EXAM_CONTENT_FIELDS.DESCRIPTION, content: seoDescription },
    ]
    const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)
    const processedDescription =
      this.processContentAndRenderHtmlUseCase.getProcessedContent(
        processedResults,
        EXAM_CONTENT_FIELDS.DESCRIPTION,
      ) || seoDescription

    const examContentResponse = await this.getPublicStudentExamContentUseCase.execute(
      exam.examId,
      undefined,
      expirySeconds,
    )

    const examContent = await this.buildExamContentHtml(examContentResponse.data, expirySeconds)

    return BaseResponseDto.success('Lay chi tiet de thi public thanh cong', {
      examId: exam.examId,
      title: exam.title,
      subject: exam.subject?.name || null,
      grade: exam.grade ?? null,
      examType: exam.typeOfExam ?? null,
      examContent,
      processedDescription: processedDescription ?? null,
      description: seoDescription,
      solutionYoutubeUrl: exam.solutionYoutubeUrl ?? null
    } as any)
  }

  private buildSeoDescription(title: string, description?: string | null): string {
    const titleText = title?.trim() || 'de thi'
    const introduction = `Beeedu.vn giới thiệu đến quý thầy, cô giáo và các em học sinh ${titleText}. Đề thi có đáp án và hướng dẫn chấm điểm.`
    const excerptLine = `Trích dẫn ${titleText}:`
    const descriptionText = description?.trim()

    return descriptionText
      ? `${introduction}\n\n${excerptLine}\n\n${descriptionText}`
      : `${introduction}\n\n${excerptLine}`
  }

  private async buildExamContentHtml(examContentData: any, expirySeconds: number): Promise<string> {
    const parts: string[] = []

    const sections = (Array.isArray(examContentData?.sections) ? examContentData.sections : [])
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    const questions = (Array.isArray(examContentData?.questions) ? examContentData.questions : [])
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))

    const questionsBySectionId = new Map<number, any[]>()
    const unsectionedQuestions: any[] = []
    const contentFields: ContentField[] = []

    for (const question of questions) {
      const questionFieldName = this.getQuestionFieldName(question)
      if (questionFieldName && question?.content) {
        contentFields.push({
          fieldName: questionFieldName,
          content: String(question.content),
        })
      }

      const statements = (Array.isArray(question?.statements) ? question.statements : [])
        .slice()
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      for (let idx = 0; idx < statements.length; idx++) {
        const statement = statements[idx]
        const statementFieldName = this.getStatementFieldName(question, statement, idx)
        if (statementFieldName && statement?.content) {
          contentFields.push({
            fieldName: statementFieldName,
            content: String(statement.content),
          })
        }
      }

      if (question?.sectionId === null || question?.sectionId === undefined) {
        unsectionedQuestions.push(question)
        continue
      }

      if (!questionsBySectionId.has(question.sectionId)) {
        questionsBySectionId.set(question.sectionId, [])
      }
      questionsBySectionId.get(question.sectionId)!.push(question)
    }

    for (const section of sections) {
      const sectionFieldName = this.getSectionDescriptionFieldName(section)
      if (sectionFieldName && section?.description) {
        contentFields.push({
          fieldName: sectionFieldName,
          content: String(section.description),
        })
      }
    }

    const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)

    for (const section of sections) {
      if (section?.title) {
        parts.push(`<h2>${this.escapeHtml(String(section.title))}</h2>`)
      }

      const sectionDescriptionFieldName = this.getSectionDescriptionFieldName(section)
      if (sectionDescriptionFieldName && section?.description) {
        const sectionDescriptionHtml = this.processContentAndRenderHtmlUseCase.getProcessedContent(
          processedResults,
          sectionDescriptionFieldName,
        )
        if (sectionDescriptionHtml) {
          parts.push(String(sectionDescriptionHtml))
        }
      }

      const sectionQuestions = (questionsBySectionId.get(section?.sectionId) || [])
        .slice()
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))

      let questionNumber = 1
      for (const question of sectionQuestions) {
        this.appendQuestionHtml(parts, question, questionNumber, processedResults)
        questionNumber++
      }
    }

    let unsectionedQuestionNumber = 1
    for (const question of unsectionedQuestions.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))) {
      this.appendQuestionHtml(parts, question, unsectionedQuestionNumber, processedResults)
      unsectionedQuestionNumber++
    }

    return parts.filter(Boolean).join('\n')
  }

  private appendQuestionHtml(
    parts: string[],
    question: any,
    questionNumber: number,
    processedResults: ProcessedContentField[],
  ): void {
    const questionFieldName = this.getQuestionFieldName(question)
    const questionHtml = questionFieldName
      ? this.processContentAndRenderHtmlUseCase.getProcessedContent(processedResults, questionFieldName)
      : null

    const questionParts: string[] = []

    if (questionHtml) {
      questionParts.push(`<div><strong>Câu ${questionNumber}:</strong> ${this.unwrapParagraph(String(questionHtml))}</div>`)
    }

    const statements = Array.isArray(question?.statements) ? question.statements : []
    const sortedStatements = statements.slice().sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))

    for (let index = 0; index < sortedStatements.length; index++) {
      const statement = sortedStatements[index]
      const statementFieldName = this.getStatementFieldName(question, statement, index)
      if (!statementFieldName) {
        continue
      }

      const statementHtml = this.processContentAndRenderHtmlUseCase.getProcessedContent(
        processedResults,
        statementFieldName,
      )
      if (!statementHtml) {
        continue
      }

      const prefix = this.getStatementPrefix(index, question?.type)
      questionParts.push(`<div><strong>${prefix}</strong> ${this.unwrapParagraph(String(statementHtml))}</div>`)
    }

    if (questionParts.length > 0) {
      parts.push(`<div style="margin-bottom:16px;">${questionParts.join('')}</div>`)
    }
  }

  private getSectionDescriptionFieldName(section: any): string | null {
    if (!section?.sectionId) {
      return null
    }
    return `SECTION_DESCRIPTION_${section.sectionId}`
  }

  private getQuestionFieldName(question: any): string | null {
    if (!question?.questionId) {
      return null
    }
    return `QUESTION_CONTENT_${question.questionId}`
  }

  private getStatementFieldName(question: any, statement: any, index: number): string | null {
    if (!question?.questionId) {
      return null
    }
    const statementIdPart = statement?.statementId ?? index
    return `QUESTION_STATEMENT_${question.questionId}_${statementIdPart}`
  }

  private getStatementPrefix(index: number, questionType?: string): string {
    const alpha = this.toAlphabet(index, questionType === QuestionType.TRUE_FALSE)
    return questionType === QuestionType.TRUE_FALSE ? `${alpha})` : `${alpha}.`
  }

  private toAlphabet(index: number, lowercase: boolean): string {
    const base = lowercase ? 97 : 65
    let value = index + 1
    let result = ''

    while (value > 0) {
      const rem = (value - 1) % 26
      result = String.fromCharCode(base + rem) + result
      value = Math.floor((value - 1) / 26)
    }

    return result
  }

  private unwrapParagraph(html: string): string {
    const trimmed = html.trim()
    const match = trimmed.match(/^<p>([\s\S]*)<\/p>$/i)
    return match ? match[1] : trimmed
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
