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

            const existingDocumentContent = await documentContentRepository.findById(id)
            if (!existingDocumentContent) {
                throw new NotFoundException(`Document content with ID ${id} not found`)
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
                    },
                })
            }

            return DocumentContentResponseDto.fromEntity(documentContent)
        })

        return BaseResponseDto.success('Document content updated successfully', result)
    }
}
