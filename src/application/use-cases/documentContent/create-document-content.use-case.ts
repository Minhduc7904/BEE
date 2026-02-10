// src/application/use-cases/documentContent/create-document-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateDocumentContentDto } from '../../dtos/documentContent/create-document-content.dto'
import { DocumentContentResponseDto } from '../../dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaVisibility } from 'src/shared/enums'
import { FIELD_NAMES } from 'src/shared/constants/field-name.constants'

@Injectable()
export class CreateDocumentContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateDocumentContentDto, adminId?: number): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const documentContentRepository = repos.documentContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            // Auto-calculate orderInDocument as max + 1
            const maxOrder = await documentContentRepository.getMaxOrderByLearningItem(dto.learningItemId)
            const orderInDocument = maxOrder + 1

            const documentContent = await documentContentRepository.create({
                learningItemId: dto.learningItemId,
                content: dto.content,
                orderInDocument,
            })

            // Attach media usages if mediaIds provided
            if (dto.mediaIds && dto.mediaIds.length > 0) {
                await Promise.all(
                    dto.mediaIds.map((mediaId) =>
                        mediaUsageRepository.attach({
                            mediaId,
                            entityType: EntityType.DOCUMENT_CONTENT,
                            entityId: documentContent.documentContentId,
                            fieldName: FIELD_NAMES.DOCUMENT_FILE,
                            usedBy: adminId,
                            visibility: MediaVisibility.PUBLIC,
                        })
                    )
                )
            }

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.DOCUMENT_CONTENT.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.DOCUMENT_CONTENT,
                    resourceId: documentContent.documentContentId.toString(),
                    afterData: {
                        learningItemId: documentContent.learningItemId,
                        content: documentContent.content,
                        orderInDocument: documentContent.orderInDocument,
                        mediaIds: dto.mediaIds,
                    },
                })
            }

            return DocumentContentResponseDto.fromEntity(documentContent)
        })

        return BaseResponseDto.success('Document content created successfully', result)
    }
}

