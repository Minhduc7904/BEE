// src/application/use-cases/statement/statement.application.module.ts
import { Module } from '@nestjs/common'

import * as statementUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'

const STATEMENT_USE_CASES = [
  statementUseCase.CreateStatementUseCase,
  statementUseCase.UpdateStatementUseCase,
  statementUseCase.DeleteStatementUseCase,
  AttachMediaFromContentUseCase,
]

@Module({
  imports: [
    InfrastructureModule,
  ],
  providers: STATEMENT_USE_CASES,
  exports: STATEMENT_USE_CASES,
})
export class StatementApplicationModule {}
