// src/application/use-cases/temp-section/temp-section.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    GetTempSectionsByExamUseCase,
    GetTempSectionByIdUseCase,
    CreateTempSectionUseCase,
    UpdateTempSectionUseCase,
    DeleteTempSectionUseCase,
    ReorderTempSectionsUseCase,
} from '.'

@Module({
    imports: [InfrastructureModule],
    providers: [
        GetTempSectionsByExamUseCase,
        GetTempSectionByIdUseCase,
        CreateTempSectionUseCase,
        UpdateTempSectionUseCase,
        DeleteTempSectionUseCase,
        ReorderTempSectionsUseCase,
    ],
    exports: [
        GetTempSectionsByExamUseCase,
        GetTempSectionByIdUseCase,
        CreateTempSectionUseCase,
        UpdateTempSectionUseCase,
        DeleteTempSectionUseCase,
        ReorderTempSectionsUseCase,
    ],
})
export class TempSectionApplicationModule { }
