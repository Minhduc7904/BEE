// src/application/use-cases/media/attach-media-from-content.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IMediaRepository, IMediaUsageRepository } from '../../../domain/repositories'
import { extractAllMediaIds, normalizeMediaMarkdown } from '../../../shared/utils'
import { EntityType } from '../../../shared/constants/entity-type.constants'

export interface ContentField {
    fieldName?: string
    content: string | null | undefined
}

export interface NormalizedResult {
    fieldName: string | null
    originalContent: string | null | undefined
    normalizedContent: string | null
    mediaIds: number[]
}

@Injectable()
export class AttachMediaFromContentUseCase {
    constructor(
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
    ) { }

    /**
     * Normalize content fields and extract media IDs
     * @param fields - Array of content fields to process
     * @returns Array of normalized results with media IDs
     */
    normalizeAndExtract(fields: ContentField[]): NormalizedResult[] {
        return fields.map((field) => {
            const normalizedContent = field.content
                ? normalizeMediaMarkdown(field.content)
                : null

            const extractedIds = normalizedContent
                ? extractAllMediaIds(normalizedContent)
                : []

            // Convert to array if it's a Set
            const mediaIds = Array.isArray(extractedIds) 
                ? extractedIds 
                : Array.from(extractedIds)

            return {
                fieldName: field.fieldName || null,
                originalContent: field.content,
                normalizedContent,
                mediaIds,
            }
        })
    }

    /**
     * Attach media from normalized contents to entity with field names
     * @param normalizedResults - Results from normalizeAndExtract
     * @param entityType - Type of entity (QUESTION, EXAM, etc.)
     * @param entityId - ID of the entity
     * @param userId - ID of user performing the action
     * @param mediaUsageRepository - Repository to attach media
     */
    async attachMedia(
        normalizedResults: NormalizedResult[],
        entityType: EntityType,
        entityId: number,
        userId: number,
        mediaUsageRepository: any,
    ): Promise<void> {
        // Collect all unique media IDs with their field names
        const mediaFieldMap = new Map<number, Set<string | null>>()

        for (const result of normalizedResults) {
            if (!result.mediaIds || result.mediaIds.length === 0) continue

            for (const mediaId of result.mediaIds) {
                if (!mediaFieldMap.has(mediaId)) {
                    mediaFieldMap.set(mediaId, new Set())
                }
                mediaFieldMap.get(mediaId)!.add(result.fieldName)
            }
        }

        if (mediaFieldMap.size === 0) return

        const mediaIds = Array.from(mediaFieldMap.keys())

        // Verify media exists
        const medias = await this.mediaRepository.findByIds(mediaIds)
        const existingMediaIds = new Set(medias.map((m) => m.mediaId))

        // Check existing usages
        const existingUsages = await mediaUsageRepository.findExistingByEntity(
            mediaIds,
            entityType,
            entityId,
        )

        // Create a map of existing usages by mediaId and fieldName
        const existingUsageMap = new Map<string, boolean>()
        for (const usage of existingUsages) {
            const key = `${usage.mediaId}-${usage.fieldName || 'null'}`
            existingUsageMap.set(key, true)
        }

        // Attach new media usages
        const attachTasks: Promise<any>[] = []

        for (const [mediaId, fieldNames] of mediaFieldMap.entries()) {
            if (!existingMediaIds.has(mediaId)) continue

            for (const fieldName of fieldNames) {
                const key = `${mediaId}-${fieldName || 'null'}`

                // Skip if already attached
                if (existingUsageMap.has(key)) continue

                attachTasks.push(
                    mediaUsageRepository.attach({
                        mediaId,
                        entityType,
                        entityId,
                        fieldName: fieldName || undefined,
                        usedBy: userId,
                    }),
                )
            }
        }

        await Promise.all(attachTasks)
    }

    /**
     * Combined method: normalize, extract, and attach in one call
     * @param fields - Array of content fields to process
     * @param entityType - Type of entity
     * @param entityId - ID of the entity
     * @param userId - ID of user performing the action
     * @param mediaUsageRepository - Repository to attach media
     * @returns Normalized results
     */
    async processAndAttach(
        fields: ContentField[],
        entityType: EntityType,
        entityId: number,
        userId: number,
        mediaUsageRepository: any,
    ): Promise<NormalizedResult[]> {
        const normalizedResults = this.normalizeAndExtract(fields)
        await this.attachMedia(normalizedResults, entityType, entityId, userId, mediaUsageRepository)
        return normalizedResults
    }

    /**
     * Get all unique media IDs from normalized results
     */
    getAllMediaIds(normalizedResults: NormalizedResult[]): number[] {
        const mediaIds = new Set<number>()

        for (const result of normalizedResults) {
            if (result.mediaIds && result.mediaIds.length > 0) {
                result.mediaIds.forEach((id) => mediaIds.add(id))
            }
        }

        return Array.from(mediaIds)
    }

    /**
     * Get normalized content by field name
     * If fieldName is not provided or null, returns the first result
     */
    getNormalizedContent(
        normalizedResults: NormalizedResult[],
        fieldName?: string | null,
    ): string | null {
        if (!fieldName) {
            // Return first result if no fieldName specified
            return normalizedResults[0]?.normalizedContent || null
        }
        const result = normalizedResults.find((r) => r.fieldName === fieldName)
        return result?.normalizedContent || null
    }

    /**
     * Sync media when content is updated
     * - Detach old media that's no longer used
     * - Attach new media that's been added
     * @param oldContent - Previous content
     * @param newContent - New content
     * @param entityType - Type of entity
     * @param entityId - ID of the entity
     * @param userId - ID of user performing the action
     * @param mediaUsageRepository - Repository to manage media usage
     * @param fieldName - Optional field name for tracking
     */
    async syncMediaOnUpdate(
        oldContent: string | null | undefined,
        newContent: string | null | undefined,
        entityType: EntityType,
        entityId: number,
        userId: number,
        mediaUsageRepository: any,
        fieldName?: string,
    ): Promise<void> {
        // Extract media IDs from old and new content
        const oldMediaIds = new Set(oldContent ? extractAllMediaIds(oldContent) : [])
        const newMediaIds = new Set(newContent ? extractAllMediaIds(newContent) : [])

        // Detach media that's no longer in the new content
        const mediaToDetach = Array.from(oldMediaIds).filter((id) => !newMediaIds.has(id))
        
        for (const mediaId of mediaToDetach) {
            const filter: any = {
                mediaId,
                entityType,
                entityId,
            }
            
            // Add fieldName to filter if provided
            if (fieldName) {
                filter.fieldName = fieldName
            }

            const existingUsages = await mediaUsageRepository.findAll(filter)
            
            for (const usage of existingUsages) {
                await mediaUsageRepository.detach(usage.usageId)
            }
        }

        // Attach new media that wasn't in the old content
        const mediaToAttach = Array.from(newMediaIds).filter((id) => !oldMediaIds.has(id))
        
        if (mediaToAttach.length === 0) return

        // Verify media exists
        const medias = await this.mediaRepository.findByIds(mediaToAttach)
        const existingMediaIds = new Set(medias.map((m) => m.mediaId))

        // Check existing usages
        const existingUsages = await mediaUsageRepository.findExistingByEntity(
            mediaToAttach,
            entityType,
            entityId,
        )

        const existingUsageMap = new Map<string, boolean>()
        for (const usage of existingUsages) {
            const key = `${usage.mediaId}-${usage.fieldName || 'null'}`
            existingUsageMap.set(key, true)
        }

        // Attach new media
        const attachTasks: Promise<any>[] = []

        for (const mediaId of mediaToAttach) {
            if (!existingMediaIds.has(mediaId)) continue

            const key = `${mediaId}-${fieldName || 'null'}`
            
            // Skip if already attached
            if (existingUsageMap.has(key)) continue

            attachTasks.push(
                mediaUsageRepository.attach({
                    mediaId,
                    entityType,
                    entityId,
                    fieldName: fieldName || undefined,
                    usedBy: userId,
                }),
            )
        }

        await Promise.all(attachTasks)
    }

    /**
     * Sync media for multiple fields on update
     * @param updates - Array of field updates with old and new content
     * @param entityType - Type of entity
     * @param entityId - ID of the entity
     * @param userId - ID of user performing the action
     * @param mediaUsageRepository - Repository to manage media usage
     */
    async syncMultipleFieldsOnUpdate(
        updates: Array<{
            fieldName?: string
            oldContent: string | null | undefined
            newContent: string | null | undefined
        }>,
        entityType: EntityType,
        entityId: number,
        userId: number,
        mediaUsageRepository: any,
    ): Promise<void> {
        for (const update of updates) {
            await this.syncMediaOnUpdate(
                update.oldContent,
                update.newContent,
                entityType,
                entityId,
                userId,
                mediaUsageRepository,
                update.fieldName,
            )
        }
    }

    /**
     * Detach all media from an entity (used when deleting entity)
     * @param entityType - Type of entity
     * @param entityId - ID of the entity
     * @param mediaUsageRepository - Repository to manage media usage
     */
    async detachAllMediaFromEntity(
        entityType: EntityType,
        entityId: number,
        mediaUsageRepository: any,
    ): Promise<void> {
        const existingUsages = await mediaUsageRepository.findByEntity(entityType, entityId)
        
        const detachTasks: Promise<any>[] = []
        for (const usage of existingUsages) {
            detachTasks.push(mediaUsageRepository.detach(usage.usageId))
        }

        await Promise.all(detachTasks)
    }
}
