import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import * as achievementUseCases from './'

const ACHIEVEMENT_USE_CASES = [
  achievementUseCases.CreateAchievementBoardUseCase,
  achievementUseCases.UpdateAchievementBoardUseCase,
  achievementUseCases.DeleteAchievementBoardUseCase,
  achievementUseCases.GetAchievementBoardsUseCase,
  achievementUseCases.UpdateAchievementRowUseCase,
  achievementUseCases.DeleteAchievementRowUseCase,
  achievementUseCases.ExportAchievementRowTemplateUseCase,
  achievementUseCases.ImportAchievementRowsUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: ACHIEVEMENT_USE_CASES,
  exports: ACHIEVEMENT_USE_CASES,
})
export class AchievementApplicationModule {}
