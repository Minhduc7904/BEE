// src/application/use-cases/documentContent/delete-document-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class DeleteDocumentContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, adminId?: number): Promise<BaseResponseDto<null>> {
        await this.unitOfWork.executeInTransaction(async (repos) => {
            const documentContentRepository = repos.documentContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const documentContent = await documentContentRepository.findById(id)
            if (!documentContent) {
                throw new NotFoundException(`Document content with ID ${id} not found`)
            }

            await documentContentRepository.delete(id)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.DOCUMENT_CONTENT.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.DOCUMENT_CONTENT,
                    resourceId: documentContent.documentContentId.toString(),
                    beforeData: {
                        learningItemId: documentContent.learningItemId,
                        content: documentContent.content,
                        orderInDocument: documentContent.orderInDocument,
                    },
                })
            }
        })

        return BaseResponseDto.success('Document content deleted successfully', null)
    }
}
