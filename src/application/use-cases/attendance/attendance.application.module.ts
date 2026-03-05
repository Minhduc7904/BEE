import { Module } from '@nestjs/common'
import * as attendanceUseCases from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'

const ATTENDANCE_USE_CASES = [
  attendanceUseCases.CreateAttendanceUseCase,
  attendanceUseCases.GetAttendanceByIdUseCase,
  attendanceUseCases.UpdateAttendanceUseCase,
  attendanceUseCases.DeleteAttendanceUseCase,
  attendanceUseCases.CreateBulkAttendanceBySessionUseCase,
  attendanceUseCases.ExportAttendanceBySessionUseCase,
  attendanceUseCases.ExportAttendanceImageUseCase,
  attendanceUseCases.GetAllAttendanceUseCase,
  attendanceUseCases.GetAttendanceStatisticsBySessionUseCase,
  attendanceUseCases.UpdateAttendanceUseCase,
  attendanceUseCases.ToggleParentNotifiedUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
  ],
  providers: ATTENDANCE_USE_CASES,
  exports: ATTENDANCE_USE_CASES,
})
export class AttendanceApplicationModule {}
