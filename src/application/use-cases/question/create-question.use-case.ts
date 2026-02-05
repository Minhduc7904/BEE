// src/application/use-cases/question/create-question.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { CreateQuestionDto } from '../../dtos/question/create-question.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionResponseDto } from '../../dtos/question/question.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { Visibility } from 'src/shared/enums'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { QUESTION_MEDIA_FIELDS, STATEMENT_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,

    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,

    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(dto: CreateQuestionDto, adminId?: number): Promise<BaseResponseDto<QuestionResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const questionRepository = repos.questionRepository
      const questionChapterRepository = repos.questionChapterRepository
      const statementRepository = repos.statementRepository
      const mediaUsageRepository = repos.mediaUsageRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      // Normalize and extract media from question content
      const questionResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
        { fieldName: QUESTION_MEDIA_FIELDS.CONTENT, content: dto.content },
        { fieldName: QUESTION_MEDIA_FIELDS.SOLUTION, content: dto.solution },
      ])

      const createData = {
        content: this.attachMediaFromContentUseCase.getNormalizedContent(questionResults, QUESTION_MEDIA_FIELDS.CONTENT) || '',
        type: dto.type,
        correctAnswer: dto.correctAnswer,
        solution: this.attachMediaFromContentUseCase.getNormalizedContent(questionResults, QUESTION_MEDIA_FIELDS.SOLUTION) || undefined,
        solutionYoutubeUrl: dto.solutionYoutubeUrl,
        difficulty: dto.difficulty || null,
        grade: dto.grade || null,
        subjectId: dto.subjectId,
        pointsOrigin: dto.pointsOrigin,
        visibility: dto.visibility || Visibility.DRAFT,
        createdBy: adminId!,
      }

      const question = await questionRepository.create(createData)

      // Attach media for question
      await this.attachMediaFromContentUseCase.attachMedia(
        questionResults,
        EntityType.QUESTION,
        question.questionId,
        adminId!,
        mediaUsageRepository,
      )

      // Link chapters if provided
      if (dto.chapterIds && dto.chapterIds.length > 0) {
        const chapterData = dto.chapterIds.map((chapterId) => ({
          questionId: question.questionId,
          chapterId,
        }))
        await questionChapterRepository.createMany(chapterData)
      }

      // Create statements if provided
      if (dto.statements && dto.statements.length > 0) {
        for (let i = 0; i < dto.statements.length; i++) {
          const statement = dto.statements[i]
          
          // Normalize statement content
          const statementResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
            { fieldName: STATEMENT_MEDIA_FIELDS.CONTENT, content: statement.content },
          ])

          const statementData = {
            questionId: question.questionId,
            content: this.attachMediaFromContentUseCase.getNormalizedContent(statementResults, STATEMENT_MEDIA_FIELDS.CONTENT) || '',
            isCorrect: statement.isCorrect,
            order: statement.order !== undefined ? statement.order : i + 1,
            difficulty: statement.difficulty || null,
          }

          const createdStatement = await statementRepository.create(statementData)

          // Attach media for statement
          await this.attachMediaFromContentUseCase.attachMedia(
            statementResults,
            EntityType.STATEMENT,
            createdStatement.statementId,
            adminId!,
            mediaUsageRepository,
          )
        }
      }

      if (adminId) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.QUESTION.CREATE,
          status: AuditStatus.SUCCESS,
          resourceType: RESOURCE_TYPES.QUESTION,
          resourceId: question.questionId.toString(),
          afterData: {
            type: question.type,
            visibility: question.visibility,
            subjectId: question.subjectId,
          },
        })
      }

      // Reload to get relations
      return await questionRepository.findById(question.questionId)
    })

    return {
      success: true,
      message: 'Tạo câu hỏi thành công',
      data: QuestionResponseDto.fromEntity(result!),
    }
  }
}
