// src/application/use-cases/temp-question/get-temp-question-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ITempQuestionRepository } from '../../../domain/repositories/temp-question.repository'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { TempQuestionResponseDto } from '../../dtos/temp-question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { extractMediaIdsFromAlt } from '../../../shared/utils'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetTempQuestionByIdUseCase {
    constructor(
        @Inject('ITempQuestionRepository')
        private readonly tempQuestionRepository: ITempQuestionRepository,
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(
        tempQuestionId: number,
        expirySeconds = 3600,
    ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
        /* ------------------------------------------------------------------
         * 1. Find temp question by ID
         * ------------------------------------------------------------------ */
        const tempQuestion = await this.tempQuestionRepository.findById(tempQuestionId)

        if (!tempQuestion) {
            throw new NotFoundException(`Temp question with ID ${tempQuestionId} not found`)
        }

        // Convert entity to DTO
        const questionDto = TempQuestionResponseDto.fromEntity(tempQuestion)

        /* ------------------------------------------------------------------
         * 2. Extract all mediaIds from question and statements
         * ------------------------------------------------------------------ */
        const allMediaIds = new Set<number>()

        // Extract from question content
        const contentMediaIds = extractMediaIdsFromAlt(questionDto.content)
        contentMediaIds.forEach((id) => allMediaIds.add(id))

        // Extract from solution
        if (questionDto.solution) {
            const solutionMediaIds = extractMediaIdsFromAlt(questionDto.solution)
            solutionMediaIds.forEach((id) => allMediaIds.add(id))
        }

        // Extract from statements
        if (questionDto.tempStatements) {
            for (const stmt of questionDto.tempStatements) {
                const stmtMediaIds = extractMediaIdsFromAlt(stmt.content)
                stmtMediaIds.forEach((id) => allMediaIds.add(id))
            }
        }

        /* ------------------------------------------------------------------
         * 3. Generate presigned URLs for all mediaIds
         * ------------------------------------------------------------------ */
        const mediaIdToUrlMap = new Map<number, string>()

        if (allMediaIds.size > 0) {
            const mediaList = await Promise.all(
                Array.from(allMediaIds).map((id) => this.mediaRepository.findById(id)),
            )

            const validMedia = mediaList.filter(
                (m): m is NonNullable<typeof m> => m !== null,
            )

            await Promise.all(
                validMedia.map(async (media) => {
                    try {
                        const url = await this.minioService.getPresignedUrl(
                            media.bucketName,
                            media.objectKey,
                            expirySeconds,
                        )
                        mediaIdToUrlMap.set(media.mediaId, url)
                    } catch (error) {
                        console.error(
                            `Failed to generate presigned URL for media ${media.mediaId}:`,
                            error,
                        )
                    }
                }),
            )
        }

        /* ------------------------------------------------------------------
         * 4. Helper function to replace markdown images
         * Pattern: ![media:75](media:75) -> ![media:75](presigned-url)
         * ------------------------------------------------------------------ */
        const replaceMarkdownImages = (content: string): string => {
            const imagePattern = /!\[media:(\d+)\]\([^)]+\)/g
            return content.replace(imagePattern, (fullMatch, mediaIdStr) => {
                const id = Number(mediaIdStr)
                const url = mediaIdToUrlMap.get(id)
                if (!url) return fullMatch
                return `![media:${id}](${url})`
            })
        }

        /* ------------------------------------------------------------------
         * 5. Process question and statements
         * ------------------------------------------------------------------ */
        // Process question content
        questionDto.processedContent = replaceMarkdownImages(questionDto.content)

        // Process solution
        if (questionDto.solution) {
            questionDto.processedSolution = replaceMarkdownImages(questionDto.solution)
        }

        // Process statements
        if (questionDto.tempStatements) {
            for (const stmt of questionDto.tempStatements) {
                stmt.processedContent = replaceMarkdownImages(stmt.content)
            }
        }

        return {
            success: true,
            message: `Lấy thông tin câu hỏi tạm thời thành công`,
            data: questionDto,
        }
    }
}
