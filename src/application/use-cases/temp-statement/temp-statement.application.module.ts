// src/application/use-cases/temp-statement/temp-statement.application.module.ts
import { Module } from '@nestjs/common'
import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import {
    CreateTempStatementUseCase,
    UpdateTempStatementUseCase,
    DeleteTempStatementUseCase,
    ReorderTempStatementsUseCase,
} from '.'

@Module({
    imports: [InfrastructureModule],
    providers: [
        CreateTempStatementUseCase,
        UpdateTempStatementUseCase,
        DeleteTempStatementUseCase,
        ReorderTempStatementsUseCase,
    ],
    exports: [
        CreateTempStatementUseCase,
        UpdateTempStatementUseCase,
        DeleteTempStatementUseCase,
        ReorderTempStatementsUseCase,
    ],
})
export class TempStatementApplicationModule { }
