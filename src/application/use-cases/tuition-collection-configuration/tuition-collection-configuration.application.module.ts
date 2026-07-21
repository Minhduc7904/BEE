import { Module } from '@nestjs/common'

import { InfrastructureModule } from '../../../infrastructure/infrastructure.module'
import * as tuitionCollectionConfigurationUseCases from './'

const TUITION_COLLECTION_CONFIGURATION_USE_CASES = [
  tuitionCollectionConfigurationUseCases.GetTuitionCollectionConfigurationUseCase,
  tuitionCollectionConfigurationUseCases.UpdateTuitionCollectionConfigurationUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: TUITION_COLLECTION_CONFIGURATION_USE_CASES,
  exports: TUITION_COLLECTION_CONFIGURATION_USE_CASES,
})
export class TuitionCollectionConfigurationApplicationModule {}
