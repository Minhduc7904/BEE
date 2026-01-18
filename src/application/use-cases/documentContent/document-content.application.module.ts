// src/application/use-cases/documentContent/document-content.application.module.ts
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    GetAllDocumentContentUseCase,
    GetDocumentContentByIdUseCase,
    CreateDocumentContentUseCase,
    UpdateDocumentContentUseCase,
    DeleteDocumentContentUseCase,
} from './index'

@Module({
    imports: [PrismaModule, InfrastructureModule],
    providers: [
        GetAllDocumentContentUseCase,
        GetDocumentContentByIdUseCase,
        CreateDocumentContentUseCase,
        UpdateDocumentContentUseCase,
        DeleteDocumentContentUseCase,
    ],
    exports: [
        GetAllDocumentContentUseCase,
        GetDocumentContentByIdUseCase,
        CreateDocumentContentUseCase,
        UpdateDocumentContentUseCase,
        DeleteDocumentContentUseCase,
    ],
})
export class DocumentContentApplicationModule { }
