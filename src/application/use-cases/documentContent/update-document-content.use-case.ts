// src/application/use-cases/documentContent/update-document-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateDocumentContentDto } from '../../dtos/documentContent/update-document-content.dto'
import { DocumentContentResponseDto } from '../../dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaVisibility } from 'src/shared/enums'
import { FIELD_NAMES } from 'src/shared/constants/field-name.constants'

@Injectable()
export class UpdateDocumentContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateDocumentContentDto, adminId?: number): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const documentContentRepository = repos.documentContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            const existingDocumentContent = await documentContentRepository.findById(id)
            if (!existingDocumentContent) {
                throw new NotFoundException(`Document content with ID ${id} not found`)
            }

            // Handle media usage update if mediaIds provided
            if (dto.mediaIds !== undefined) {
                // Get existing media usages
                const existingUsages = await mediaUsageRepository.findByEntity(
                    EntityType.DOCUMENT_CONTENT,
                    id,
                    FIELD_NAMES.DOCUMENT_FILE
                )
                
                const existingMediaIds = existingUsages.map(usage => usage.mediaId)
                const newMediaIds = dto.mediaIds || []

                // Find media to remove (exist in old but not in new)
                const mediaIdsToRemove = existingMediaIds.filter(mediaId => !newMediaIds.includes(mediaId))
                
                // Find media to add (exist in new but not in old)
                const mediaIdsToAdd = newMediaIds.filter(mediaId => !existingMediaIds.includes(mediaId))

                // Remove old usages
                if (mediaIdsToRemove.length > 0) {
                    const usagesToRemove = existingUsages.filter(usage => mediaIdsToRemove.includes(usage.mediaId))
                    await Promise.all(
                        usagesToRemove.map(usage => mediaUsageRepository.detach(usage.usageId))
                    )
                }

                // Add new usages
                if (mediaIdsToAdd.length > 0) {
                    await Promise.all(
                        mediaIdsToAdd.map(mediaId =>
                            mediaUsageRepository.attach({
                                mediaId,
                                entityType: EntityType.DOCUMENT_CONTENT,
                                entityId: id,
                                fieldName: FIELD_NAMES.DOCUMENT_FILE,
                                usedBy: adminId,
                                visibility: MediaVisibility.PUBLIC,
                            })
                        )
                    )
                }
            }

            const documentContent = await documentContentRepository.update(id, dto)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.DOCUMENT_CONTENT.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.DOCUMENT_CONTENT,
                    resourceId: documentContent.documentContentId.toString(),
                    beforeData: {
                        content: existingDocumentContent.content,
                        orderInDocument: existingDocumentContent.orderInDocument,
                    },
                    afterData: {
                        content: documentContent.content,
                        orderInDocument: documentContent.orderInDocument,
                        mediaIds: dto.mediaIds,
                    },
                })
            }

            return DocumentContentResponseDto.fromEntity(documentContent)
        })

        return BaseResponseDto.success('Document content updated successfully', result)
    }
}
