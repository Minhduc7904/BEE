import { Module } from '@nestjs/common'
import * as attendanceUseCases from './'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { NotificationApplicationModule } from '../notification/notification.application.module'
import { GetValidZaloAccessTokenUseCase } from '../zalo/get-valid-zalo-access-token.use-case'

const ATTENDANCE_USE_CASES = [
  attendanceUseCases.CreateAttendanceUseCase,
  attendanceUseCases.GetAttendanceByIdUseCase,
  attendanceUseCases.UpdateAttendanceUseCase,
  attendanceUseCases.DeleteAttendanceUseCase,
  attendanceUseCases.CreateBulkAttendanceBySessionUseCase,
  attendanceUseCases.ExportAttendanceBySessionUseCase,
  attendanceUseCases.GetAttendanceImageDataUseCase,
  attendanceUseCases.ExportAttendanceImageUseCase,
  attendanceUseCases.SendAttendanceToParentUseCase,
  attendanceUseCases.SendBulkAttendanceToParentUseCase,
  attendanceUseCases.GetAllAttendanceUseCase,
  attendanceUseCases.GetAttendanceStatisticsBySessionUseCase,
  attendanceUseCases.UpdateAttendanceUseCase,
  attendanceUseCases.ToggleParentNotifiedUseCase,
  GetValidZaloAccessTokenUseCase,
]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC
    NotificationApplicationModule, // 🔔 For attendance notifications
  ],
  providers: ATTENDANCE_USE_CASES,
  exports: ATTENDANCE_USE_CASES,
})
export class AttendanceApplicationModule {}
