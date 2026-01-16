import { Module } from '@nestjs/common'

import * as learningItemUseCase from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const LEARNING_ITEM_USE_CASES = [
  learningItemUseCase.GetAllLearningItemUseCase,
  learningItemUseCase.GetLearningItemByIdUseCase,
  learningItemUseCase.CreateLearningItemUseCase,
  learningItemUseCase.UpdateLearningItemUseCase,
  learningItemUseCase.DeleteLearningItemUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],    
  providers: LEARNING_ITEM_USE_CASES,
  exports: LEARNING_ITEM_USE_CASES,
})
export class LearningItemApplicationModule {}
