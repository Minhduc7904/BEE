import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { StudentPointService } from 'src/application/services/student-point.service'
import { CreateStudentPointLogUseCase } from './create-student-point-log.use-case'
import { DeleteStudentPointLogUseCase } from './delete-student-point-log.use-case'
import { GetMyStudentPointLogsUseCase } from './get-my-student-point-logs.use-case'
import { GetStudentPointLogsByAdminUseCase } from './get-student-point-logs-by-admin.use-case'
import { UpdateStudentPointLogUseCase } from './update-student-point-log.use-case'

const STUDENT_POINT_LOG_USE_CASES = [
  CreateStudentPointLogUseCase,
  GetMyStudentPointLogsUseCase,
  GetStudentPointLogsByAdminUseCase,
  UpdateStudentPointLogUseCase,
  DeleteStudentPointLogUseCase,
  StudentPointService,
]

@Module({
  imports: [InfrastructureModule],
  providers: STUDENT_POINT_LOG_USE_CASES,
  exports: STUDENT_POINT_LOG_USE_CASES,
})
export class StudentPointLogApplicationModule {}
